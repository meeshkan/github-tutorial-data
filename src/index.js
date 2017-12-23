import "babel-polyfill";
import mysql from 'mysql';
import AWS from 'aws-sdk';
import axios from 'axios';
import urlparse from 'url-parse';
import uuidv4 from 'uuid/v4';
import _ from 'lodash';
import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import githubSaga from './github-saga';
import loggingSaga from './logging-saga';
import gracefulExitSaga from './graceful-exit-saga';
import reducers from './reducers';
import deferralMiddleware from './deferral-middleware';
import endScriptMiddleware from './end-script-middleware';
import {
  putRemaining,
  putEnv,
  putConnection,
  getTasks,
  initialAction
} from './actions';
import {
  sqlPromise
} from './util';

export default async () => {
  try {
    const populateEnvFromMonitorData = (monitorData, env) => _.fromPairs(_.uniq(Object.keys(monitorData).concat(Object.keys(env))).map(key => [key, monitorData[key] || env[key]]));
    const monitorData = await new Promise((resolve, reject) => new AWS.Lambda({region: process.env.GITHUB_TUTORIAL_AWS_REGION}).invoke({
      InvocationType: 'RequestResponse',
      FunctionName: process.env.MONITOR_FUNCTION,
      Payload: JSON.stringify({})
    }, (e, r) => e ? reject(e) : resolve(JSON.parse(r.Payload))));
    const env = populateEnvFromMonitorData(monitorData, process.env);
    if (env.SHOULD_STOP_GITHUB_TUTORIAL_EXECUTION) {
      process.exit(2);
    }
    const connection = mysql.createConnection({
      host: env.MY_SQL_HOST,
      port: env.MY_SQL_PORT,
      user: env.MY_SQL_USERNAME,
      password: env.MY_SQL_PASSWORD,
      database: env.MY_SQL_DATABASE,
      ssl: env.MY_SQL_SSL,
      supportBigNumbers: true,
      bigNumberStrings: true,
    });
    // try opening the connection
    try {
      await new Promise((resolve, reject) => connection.connect(e => e ? reject(e) : resolve()));
    } catch (e) {
      console.error(e);
      connection.destroy();
      return;
    }
    const limit = await axios(`${env.GITHUB_API}/rate_limit`);
    if (env.IS_INITIAL && JSON.parse(env.IS_INITIAL)) {
      await sqlPromise(connection, 'DROP TABLE IF EXISTS commits;');
      await sqlPromise(connection, 'DROP TABLE IF EXISTS repos;');
      await sqlPromise(connection, 'DROP TABLE IF EXISTS deferred;');
      await sqlPromise(connection, 'DROP TABLE IF EXISTS executing;');
      await sqlPromise(connection, 'DROP TABLE IF EXISTS get_commits_log;');
      await sqlPromise(connection, 'DROP TABLE IF EXISTS get_commit_log;');
      await sqlPromise(connection, 'DROP TABLE IF EXISTS get_repos_log;');
      await sqlPromise(connection, 'DROP TABLE IF EXISTS get_repo_log;');
      await sqlPromise(connection, 'DROP TABLE IF EXISTS get_last_log;');
      await sqlPromise(connection, 'DROP TABLE IF EXISTS end_script_error_log;');
      await sqlPromise(connection, 'DROP TABLE IF EXISTS spawn_server_log;');
      await sqlPromise(connection, 'CREATE TABLE commits (sha VARCHAR(40) PRIMARY KEY, repo_id INT, author_name VARCHAR(128), author_email VARCHAR(128), author_date BIGINT, committer_name VARCHAR(128), committer_email VARCHAR(128), committer_date BIGINT, author_login VARCHAR(128), author_id INT, committer_login VARCHAR(128), committer_id INT, additions INT, deletions INT, total INT, test_additions INT, test_deletions INT, test_changes INT);'); // create commit table
      await sqlPromise(connection, 'CREATE TABLE repos (id INT PRIMARY KEY, owner_login VARCHAR(128), owner_id INT, name VARCHAR(128), full_name VARCHAR(128), language VARCHAR(128), forks_count INT, stargazers_count INT, watchers_count INT, subscribers_count INT, size INT, has_issues INT, has_wiki INT, has_pages INT, has_downloads INT, pushed_at BIGINT, created_at BIGINT, updated_at BIGINT);'); // create repo table
      await sqlPromise(connection, 'CREATE TABLE deferred (id VARCHAR(36) PRIMARY KEY, action VARCHAR(32), json text);'); // create deferred table
      await sqlPromise(connection, 'CREATE TABLE executing (id VARCHAR(36) PRIMARY KEY);'); // a global state machine for the number of executing servers
      const _GENERIC_LOG_COLUMNS = 'actionId VARCHAR(36), payload TEXT, serverId VARCHAR(36), timestamp BIGINT, error TEXT, deferred TINYINT';
      await sqlPromise(connection, `CREATE TABLE get_commits_log (id INT NOT NULL AUTO_INCREMENT, computationPage INT, computationCommitCount INT, computationId BIGINT, computationOwner VARCHAR(128), computationRepo VARCHAR(128), ${_GENERIC_LOG_COLUMNS}, PRIMARY KEY (id));`);
      await sqlPromise(connection, `CREATE TABLE get_commit_log (id INT NOT NULL AUTO_INCREMENT, computationId BIGINT, computationSHA VARCHAR(40), computationOwner VARCHAR(128), computationRepo VARCHAR(128), ${_GENERIC_LOG_COLUMNS}, PRIMARY KEY (id));`);
      await sqlPromise(connection, `CREATE TABLE get_repos_log (id INT NOT NULL AUTO_INCREMENT, computationSince INT, computationReposCount VARCHAR(128), ${_GENERIC_LOG_COLUMNS}, PRIMARY KEY (id));`);
      await sqlPromise(connection, `CREATE TABLE get_repo_log (id INT NOT NULL AUTO_INCREMENT, computationOwner VARCHAR(128), computationRepo VARCHAR(128), ${_GENERIC_LOG_COLUMNS}, PRIMARY KEY (id));`);
      await sqlPromise(connection, `CREATE TABLE get_last_log (id INT NOT NULL AUTO_INCREMENT, computationId BIGINT, computationOwner VARCHAR(128), computationRepo VARCHAR(128), ${_GENERIC_LOG_COLUMNS}, PRIMARY KEY (id));`);
      await sqlPromise(connection, 'CREATE TABLE end_script_error_log (id INT NOT NULL AUTO_INCREMENT, serverId VARCHAR(36), error VARCHAR(36), timestamp BIGINT, PRIMARY KEY (id));');
      await sqlPromise(connection, 'CREATE TABLE spawn_server_log (id INT NOT NULL AUTO_INCREMENT, serverId VARCHAR(36), spawnId VARCHAR(36), timestamp BIGINT, PRIMARY KEY (id));');
      await sqlPromise(connection, 'CREATE TABLE get_tasks_log (id INT NOT NULL AUTO_INCREMENT, serverId VARCHAR(36), asked INT, got INT, timestamp BIGINT, PRIMARY KEY (id));');
      await sqlPromise(connection, 'CREATE TABLE get_tasks_failure_log (id INT NOT NULL AUTO_INCREMENT, serverId VARCHAR(36), error TEXT, timestamp BIGINT, PRIMARY KEY (id));');
    }
    const sagaMiddleware = createSagaMiddleware();
    const store = applyMiddleware(endScriptMiddleware, deferralMiddleware, sagaMiddleware)(createStore)(reducers);
    sagaMiddleware.run(githubSaga);
    sagaMiddleware.run(loggingSaga);
    sagaMiddleware.run(gracefulExitSaga);
    store.dispatch(putConnection(connection));
    store.dispatch(putEnv(env));
    store.dispatch(putRemaining(parseInt(limit.data.rate.remaining)));
    console.log(`starting batch with ${limit.data.rate.remaining}`);
    if (env.START_REPO) {   
      store.dispatch(initialAction(parseInt(env.START_REPO), uuidv4()));
    } else {
      store.dispatch(getTasks(limit.data.rate.remaining, true));
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
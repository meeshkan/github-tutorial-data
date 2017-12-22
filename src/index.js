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
import Raven from 'raven';

export default async () => {
  try {
    const populateEnvFromMonitorData = (monitorData, env) => _.fromPairs(_.uniq(Object.keys(monitorData).concat(Object.keys(env))).map(key => [key, monitorData[key] || env[key]]));
    const monitorData = await new Promise((resolve, reject) => new AWS.Lambda({region: 'us-east-1'}).invoke({
      InvocationType: 'RequestResponse',
      FunctionName: process.env.MONITOR_FUNCTION,
      Payload: JSON.stringify({})
    }, (e, r) => e ? reject(e) : resolve(JSON.parse(r.Payload))));
    const env = populateEnvFromMonitorData(monitorData, process.env);
    if (env.SHOULD_STOP_GITHUB_TUTORIAL_EXECUTION) {
      process.exit(2);
    }
    env.RAVEN_URL && Raven.config(env.RAVEN_URL).install();
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
      env.RAVEN_URL && Raven.captureException(e);
      connection.destroy();
      return;
    }
    const limit = await axios(`${env.GITHUB_API}/rate_limit`);
    if (env.IS_INITIAL && JSON.parse(env.IS_INITIAL)) {
      await sqlPromise(connection, 'DROP TABLE IF EXISTS commits;');
      await sqlPromise(connection, 'DROP TABLE IF EXISTS repos;');
      await sqlPromise(connection, 'DROP TABLE IF EXISTS deferred;');
      await sqlPromise(connection, 'DROP TABLE IF EXISTS executing;');
      await sqlPromise(connection, 'CREATE TABLE commits (sha VARCHAR(40) PRIMARY KEY, repo_id INT, author_name VARCHAR(128), author_email VARCHAR(128), author_date BIGINT, committer_name VARCHAR(128), committer_email VARCHAR(128), committer_date BIGINT, author_login VARCHAR(128), author_id INT, committer_login VARCHAR(128), committer_id INT, additions INT, deletions INT, total INT, test_additions INT, test_deletions INT, test_changes INT);'); // create commit table
      await sqlPromise(connection, 'CREATE TABLE repos (id INT PRIMARY KEY, owner_login VARCHAR(128), owner_id INT, name VARCHAR(128), full_name VARCHAR(128), language VARCHAR(128), forks_count INT, stargazers_count INT, watchers_count INT, subscribers_count INT, size INT, has_issues INT, has_wiki INT, has_pages INT, has_downloads INT, pushed_at BIGINT, created_at BIGINT, updated_at BIGINT);'); // create repo table
      await sqlPromise(connection, 'CREATE TABLE deferred (id VARCHAR(36) PRIMARY KEY, action VARCHAR(32), json TEXT);'); // create deferred table
      await sqlPromise(connection, 'CREATE TABLE executing (id VARCHAR(36) PRIMARY KEY);'); // a global state machine for the number of executing servers
    }
    const sagaMiddleware = createSagaMiddleware();
    const store = applyMiddleware(endScriptMiddleware, deferralMiddleware, sagaMiddleware)(createStore)(reducers);
    sagaMiddleware.run(githubSaga);
    store.dispatch(putConnection(connection));
    store.dispatch(putEnv(env));
    store.dispatch(putRemaining(parseInt(limit.data.rate.remaining)));
    console.log(`starting batch with ${limit.data.rate.remaining}`);
    if (env.START_REPO) {   
      store.dispatch(initialAction(parseInt(env.START_REPO)));
    } else {
      store.dispatch(getTasks(limit.data.rate.remaining, true));
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
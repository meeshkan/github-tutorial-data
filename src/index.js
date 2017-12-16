import "babel-polyfill";
import mysql from 'mysql';
import AWS from 'aws-sdk';
import axios from 'axios';
import urlparse from 'url-parse';
import uuidv4 from 'uuid/v4';
import _ from 'lodash';
import randomstring from 'randomstring';
import createSagaMiddleware from 'redux-saga';
import githubSaga from './github-saga';
import reducers from './reducers';
import {
  putCallback,
  putEnv,
  putConnection
} from './actions';
import {
  sqlPromise
} from './util';

const CONNECTIONS = 'connections';

const increaseConcurrentExecutionCount = connection => sqlPromise(connection, 'UPDATE connections SET connections = connections + 1 WHERE id = ?;', [CONNECTIONS]);

export default async (event, context, callback) => {
  const connection = mysql.createConnection({
    host: process.env.MY_SQL_HOST,
    port: process.env.MY_SQL_PORT,
    user: process.env.MY_SQL_USERNAME,
    password: process.env.MY_SQL_PASSWORD,
    database: process.env.MY_SQL_DATABASE,
    ssl: process.env.MY_SQL_SSL,
    supportBigNumbers: true,
    bigNumberStrings: true,
  });
  // try opening the connection
  try {
    await new Promise((resolve, reject) => connection.connect(e => e ? reject(e) : resolve()));
  } catch (e) {
    console.error(e);
    connection.destroy();
    callback(e);
    return;
  }
  try {
    const limit = axios(`${process.env.GITHUB_API}/rate_limit`);
    const shouldStop = await new Promise((resolve, reject) => new AWS.Lambda().invoke({
      InvocationType: 'RequestResponse',
      FunctionName: process.env.SHOULD_STOP_FUNCTION,
      Payload: JSON.stringify({})
    }, (e, r) => e ? reject(e) : resolve(r)));
    if (!parseInt(limit.data.remaining) || JSON.parse(shouldStop)) {
      await sqlPromise(connection, 'INSERT INTO deferred (id, json) VALUES (?, ?);', [uuidv4(), JSON.stringify(event)]);
      return;
    }
    await sqlPromise(connection, 'CREATE TABLE IF NOT EXISTS commits (sha VARCHAR(40) PRIMARY KEY, repo_id INT, author_name VARCHAR(128), author_email VARCHAR(128), author_date VARCHAR(64), committer_name VARCHAR(128), committer_email VARCHAR(128), committer_date VARCHAR(64), author_login VARCHAR(128), author_id INT, committer_login VARCHAR(128), committer_id INT, additions INT, deletions INT, total INT, test_additions INT, test_deletions INT, test_changes INT);'); // create commit table
    await sqlPromise(connection, 'CREATE TABLE IF NOT EXISTS repos (id INT PRIMARY KEY, owner_login VARCHAR(128), owner_id INT, name VARCHAR(128), full_name VARCHAR(128), language VARCHAR(128), forks_count INT, stargazers_count INT, watchers_count INT, subscribers_count INT, size INT, has_issues INT, has_wiki INT, has_pages INT, has_downloads INT, pushed_at VARCHAR(64), created_at VARCHAR(64), updated_at VARCHAR(64));'); // create repo table
    await sqlPromise(connection, 'CREATE TABLE IF NOT EXISTS connections (id VARCHAR(36), connections INT);'); // create connections table
    await sqlPromise(connection, 'CREATE TABLE IF NOT EXISTS deferred (id VARCHAR(36), json TEXT);'); // create deferred table
    await increaseConcurrentExecutionCount(connection);
    const sagaMiddleware = createSagaMiddleware();
    const store = applyMiddleware(sagaMiddleware)(createStore)(reducers);
    sagaMiddleware.run(githubSaga);
    store.dispatch(putConnection(connection));
    store.dispatch(putEnv(process.env));
    store.dispatch(putCallback(callback))
    store.dispatch({
      type: event._lambdaAction,
      payload: event
    });
  } catch (error) {
    console.error(error);
    callback(error);
  }
}
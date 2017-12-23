import axios from 'axios';
import uuidv4 from 'uuid/v4';

import {
  MOCK_GET_REPO_DATA,
  MOCK_GET_COMMIT_DATA,
  MOCK_GET_REPOS_DATA,
  MOCK_GET_COMMITS_DATA
} from './mock-data';

import gracefulExitSaga, {
  endScriptSideEffect,
  releaseConnectionAndExitProcessSideEffect,
  stateSelector,
  createFunction,
  exitProcess,
  getFunctionsToLaunch
} from '../src/graceful-exit-saga';

import {
  sqlPromise,
  destroy
} from '../src/util';

import {
  INSERT_REPO_STMT,
  INSERT_COMMIT_STMT,
  INSERT_DEFERRED_STMT,
  SELECT_DEFERRED_STMT,
  DELETE_DEFERRED_STMT,
  SELECT_UNFULFILLED_STMT,
  INCREASE_EXECUTING_STATEMENT,
  SELECT_EXECUTING_STATEMENT,
  DECREASE_EXECUTING_STATEMENT,
  CHANGE_UNFULFILLED_STATEMENT
} from '../src/sql';

import {
  call,
  put,
  select,
  takeEvery
} from 'redux-saga/effects';

import {
  GET_REPO,
  GET_REPOS,
  GET_LAST,
  GET_COMMIT,
  GET_COMMITS,
  GET_TASKS,
  INCREMENT_LOG_COUNT,
  DECREASE_LOG_COUNT,
  INCREASE_EXECUTION_COUNT,
  DECREASE_EXECUTION_COUNT,
  DECREASE_REMAINING,
  END_SCRIPT,
  DO_CLEANUP,
  DEFER_ACTION,
  SCRIPT_NO_LONGER_NEEDS_CONNECTION,
  SPAWN_SERVER_SUCCESS,
  getTasks,
  doCleanup,
  scriptNoLongerNeedsConnection,
  endScript
} from '../src/actions';

const CONNECTION = 'connection';
const ENV = {
  GITHUB_TUTORIAL_UNIQUE_ID: 'my-unique-id',
  WRITE_DEBUG_LOGS_TO_DB: "http://my.raven.url",
  MONITOR_FUNCTION: 'StopIt',
  GITHUB_TUTORIAL_AWS_REGION: "us-east-1",
  PACKAGE_URL: 'http://foo.bar.com/package.zip',
  PACKAGE_NAME: 'package.zip',
  PACKAGE_FOLDER: 'package',
  GITHUB_API: 'https://api.github.com',
  MAX_COMMITS: '59',
  START_REPO: '1234567',
  MAX_REPOS: '60001',
  MAX_COMPUTATIONS: '949',
  GITHUB_TUTORIAL_IMAGE_ID: 'ami-3511515',
  GITHUB_TUTORIAL_DRY_RUN: "true",
  MY_SQL_PORT: '3306',
  MY_SQL_HOST: 'my.sql.cluster',
  MY_SQL_USERNAME: 'meeshkan',
  MY_SQL_PASSWORD: 'octocatrules',
  GITHUB_TUTORIAL_SPOT_PRICE: '0.0041',
  GITHUB_TUTORIAL_SUBNET_ID: 'pfjegngwe',
  GITHUB_TUTORIAL_SECURITY_GROUP_ID: 'lajfefwfk',
  GITHUB_TUTORIAL_IAM_INSTANCE_ARN: 'arn:foo-bar',
  GITHUB_TUTORIAL_KEY_NAME: 'my-key-name',
  MY_SQL_DATABASE: 'github',
  MY_SQL_SSL: 'some ssl scheme',
  INVOCATION_TYPE: 'Event'
};

const state = {
  connection: CONNECTION,
  env: ENV
}

test('end script when we do not have enough tasks to spawn something new', () => {
  const gen = endScriptSideEffect();
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    ...state
  }).value).toEqual(call(sqlPromise, CONNECTION, SELECT_UNFULFILLED_STMT, []));
  expect(gen.next([{
    unfulfilled: 30
  }]).value).toEqual(call(sqlPromise, CONNECTION, SELECT_EXECUTING_STATEMENT, []));
  expect(gen.next([{
    executing: 17
  }]).value).toEqual(call(sqlPromise, CONNECTION, DECREASE_EXECUTING_STATEMENT, ['my-unique-id']));
  expect(gen.next().value).toEqual(call(getFunctionsToLaunch, 30, 17, 949));
  expect(gen.next(0).value).toEqual(put(scriptNoLongerNeedsConnection()));
  expect(gen.next().done).toBe(true);
});

test('get fucntions to launch', () => {
  expect(getFunctionsToLaunch(1, 0, 1)).toBe(2);
  expect(getFunctionsToLaunch(0, 1, 1)).toBe(0);
  expect(getFunctionsToLaunch(5, 1, 1)).toBeLessThanOrEqual(2);
  expect(getFunctionsToLaunch(33, 88, 900)).toBeLessThanOrEqual(2);
  expect(getFunctionsToLaunch(33, 88, 900)).toBeLessThanOrEqual(2);
  expect(getFunctionsToLaunch(43, 81, 900)).toBeLessThanOrEqual(2);
  expect(getFunctionsToLaunch(403, 882, 900)).toBeLessThanOrEqual(2);
  expect(getFunctionsToLaunch(33, 88, 1)).toBeGreaterThanOrEqual(0);
  expect(getFunctionsToLaunch(403, 882, 10)).toBe(1);
});

test('end script when we have enough tasks to spawn something new', () => {
  const gen = endScriptSideEffect();
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    ...state
  }).value).toEqual(call(sqlPromise, CONNECTION, SELECT_UNFULFILLED_STMT, []));
  expect(gen.next([{
    unfulfilled: 143
  }]).value).toEqual(call(sqlPromise, CONNECTION, SELECT_EXECUTING_STATEMENT, []));
  expect(gen.next([{
    executing: 17
  }]).value).toEqual(call(sqlPromise, CONNECTION, DECREASE_EXECUTING_STATEMENT, ['my-unique-id']));
  expect(gen.next().value).toEqual(call(getFunctionsToLaunch, 143, 17, 949));
  const USER_DATA = id => `#!/bin/bash
export GITHUB_TUTORIAL_UNIQUE_ID="${id}" && \
export WRITE_DEBUG_LOGS_TO_DB="http://my.raven.url" && \
export MY_SQL_HOST="my.sql.cluster" && \
export MY_SQL_PORT="3306" && \
export MY_SQL_USERNAME="meeshkan" && \
export MY_SQL_PASSWORD="octocatrules" && \
export MY_SQL_DATABASE="github" && \
export MY_SQL_SSL="some ssl scheme" && \
export GITHUB_API="https://api.github.com" && \
export MAX_REPOS="60001" && \
export MAX_COMMITS="59" && \
export MONITOR_FUNCTION="StopIt" && \
export MAX_COMPUTATIONS="949" && \
export PACKAGE_URL="http://foo.bar.com/package.zip" && \
export PACKAGE_NAME="package.zip" && \
export PACKAGE_FOLDER="package" && \
export GITHUB_TUTORIAL_AWS_REGION="us-east-1" && \
export GITHUB_TUTORIAL_SPOT_PRICE="0.0041" && \
export GITHUB_TUTORIAL_DRY_RUN="true" && \
export GITHUB_TUTORIAL_SUBNET_ID="pfjegngwe" && \
export GITHUB_TUTORIAL_SECURITY_GROUP_ID="lajfefwfk" && \
export GITHUB_TUTORIAL_IAM_INSTANCE_ARN="arn:foo-bar" && \
export GITHUB_TUTORIAL_IMAGE_ID="ami-3511515" && \
export GITHUB_TUTORIAL_KEY_NAME="my-key-name" && \
cd ~ && \
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash && \
export NVM_DIR="$HOME/.nvm" && \
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && \
nvm install 6.11.5 && \
mkdir $PACKAGE_FOLDER && \
cd $PACKAGE_FOLDER && \
wget $PACKAGE_URL && \
unzip $PACKAGE_NAME && \
node index.js
sudo shutdown -h now
`;
  const params = id => ({
    InstanceCount: 1,
    DryRun: true,
    InstanceInterruptionBehavior: 'terminate',
    LaunchSpecification: {
      InstanceType: 't2.micro',
      SubnetId: 'pfjegngwe',
      KeyName: 'my-key-name',
      SecurityGroupIds: [
        'lajfefwfk'
      ],
      IamInstanceProfile: {
        Arn: 'arn:foo-bar'
      },
      Monitoring: {
        Enabled: false
      },
      ImageId: 'ami-3511515',
      UserData: new Buffer(USER_DATA(id)).toString('base64')
    },
    SpotPrice: "0.0041",
    Type: "one-time"
  });
  expect(gen.next(2).value).toEqual(call(uuidv4));
  expect(gen.next('another-unique-id').value).toEqual(call(createFunction, params('another-unique-id'), ENV));
  expect(gen.next().value).toEqual(call(sqlPromise, CONNECTION, INCREASE_EXECUTING_STATEMENT, ['another-unique-id']));
  expect(gen.next().value).toEqual(put({
    type: SPAWN_SERVER_SUCCESS,
    payload: 'another-unique-id'
  }));
  expect(gen.next().value).toEqual(call(uuidv4));
  expect(gen.next('yet-another-unique-id').value).toEqual(call(createFunction, params('yet-another-unique-id'), ENV));
  expect(gen.next().value).toEqual(call(sqlPromise, CONNECTION, INCREASE_EXECUTING_STATEMENT, ['yet-another-unique-id']));
  expect(gen.next().value).toEqual(put({
    type: SPAWN_SERVER_SUCCESS,
    payload: 'yet-another-unique-id'
  }));
  expect(gen.next().value).toEqual(put(scriptNoLongerNeedsConnection()));
  expect(gen.next().done).toBe(true);
});

test('does not realse connection and exit process because we are still logging',()=>{
  const gen = releaseConnectionAndExitProcessSideEffect();
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    connection: CONNECTION,
    logCount: 1,
    scriptNoLongerNeedsConnection: true
  }).done).toBe(true);
});

test('does not realse connection and exit process because we are still running the script',()=>{
  const gen = releaseConnectionAndExitProcessSideEffect();
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    connection: CONNECTION,
    logCount: 0,
    scriptNoLongerNeedsConnection: false
  }).done).toBe(true);
});

test('releases connection',()=>{
  const gen = releaseConnectionAndExitProcessSideEffect();
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    connection: CONNECTION,
    logCount: 0,
    scriptNoLongerNeedsConnection: true
  }).value).toEqual(call(destroy, CONNECTION));
  expect(gen.next().value).toEqual(call(exitProcess));
  expect(gen.next().done).toBe(true);
});

test('graeful exit saga', () => {
  const gen = gracefulExitSaga();
  const fullSaga = [
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next()
  ].map(x => x.value);
  const sagaParts = [
    takeEvery(END_SCRIPT, endScriptSideEffect),
    takeEvery(SCRIPT_NO_LONGER_NEEDS_CONNECTION, releaseConnectionAndExitProcessSideEffect),
    takeEvery(INCREMENT_LOG_COUNT, releaseConnectionAndExitProcessSideEffect),
    takeEvery(DECREASE_LOG_COUNT, releaseConnectionAndExitProcessSideEffect)
  ];
  let i = 0;
  for (; i < sagaParts.length; i++) {
    expect(fullSaga[i]).toEqual(sagaParts[i]);
  }
  expect(fullSaga.length).toBe(sagaParts.length);
  expect(gen.next().done).toBe(true);
});
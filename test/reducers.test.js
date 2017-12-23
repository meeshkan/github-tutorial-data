import {
  putConnection,
  putEnv,
  putRemaining,
  decreaseRemaining,
  increaseExecutionCount,
  decreaseExecutionCount,
  endScript,
  scriptNoLongerNeedsConnection,
  incrementLogCount,
  decreaseLogCount
} from '../src/actions';

import reducer from '../src/reducers';

test('env and connection reducer', () => {
  expect(reducer(reducer({}, putConnection('connection')), putEnv('env'))).toEqual({
    env: 'env',
    connection: 'connection',
    executing: 0,
    remaining: 0,
    scriptEnded: false,
    scriptNoLongerNeedsConnection: false,
    logCount: 0
  });
});

test('remaining reducer', () => {
  expect(reducer(reducer({}, putRemaining(60)), decreaseRemaining())).toEqual({
    env: null,
    connection: null,
    executing: 0,
    remaining: 59,
    scriptEnded: false,
    scriptNoLongerNeedsConnection: false,
    logCount: 0
  });
});

test('execution reducer', () => {
  expect(reducer(reducer(reducer({}, increaseExecutionCount()), increaseExecutionCount()), decreaseExecutionCount())).toEqual({
    env: null,
    connection: null,
    executing: 1,
    remaining: 0,
    scriptEnded: false,
    scriptNoLongerNeedsConnection: false,
    logCount: 0
  });
});

test('script ended', () => {
  expect(reducer({}, endScript())).toEqual({
    env: null,
    connection: null,
    executing: 0,
    remaining: 0,
    scriptEnded: true,
    scriptNoLongerNeedsConnection: false,
    logCount: 0
  });
});

test('script no longer needs connection', () => {
  expect(reducer({}, scriptNoLongerNeedsConnection())).toEqual({
    env: null,
    connection: null,
    executing: 0,
    remaining: 0,
    scriptEnded: false,
    scriptNoLongerNeedsConnection: true,
    logCount: 0
  });
});

test('increase and decrease log count', () => {
  expect(reducer(reducer(reducer({}, incrementLogCount()), incrementLogCount()), decreaseLogCount())).toEqual({
    env: null,
    connection: null,
    executing: 0,
    remaining: 0,
    scriptEnded: false,
    scriptNoLongerNeedsConnection: false,
    logCount: 1
  });
});

import {
  putConnection,
  putEnv,
  putRemaining,
  decreaseRemaining,
  increaseExecutionCount,
  decreaseExecutionCount
} from '../src/actions';

import reducer from '../src/reducers';

test('env and connection reducer', () => {
  expect(reducer(reducer({}, putConnection('connection')), putEnv('env'))).toEqual({
    env: 'env',
    connection: 'connection',
    executing: 0,
    remaining: 0
  });
});

test('remaining reducer', () => {
  expect(reducer(reducer({}, putRemaining(60)), decreaseRemaining())).toEqual({
    env: null,
    connection: null,
    executing: 0,
    remaining: 59
  });
});

test('execution reducer', () => {
  expect(reducer(reducer(reducer({}, increaseExecutionCount()), increaseExecutionCount()), decreaseExecutionCount())).toEqual({
    env: null,
    connection: null,
    executing: 1,
    remaining: 0
  });
});

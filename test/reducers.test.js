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
    remaining: 0
  });
});

test('remaining reducer', () => {
  expect(reducer(reducer({}, putRemaining(60)), decreaseRemaining())).toEqual({
    env: null,
    connection: null,
    remaining: 59
  });
});


import {
  putConnection,
  putEnv,
  putRemaining,
  decreaseRemaining,
  getTasks,
  endScript,
  deferAction,
  GET_TASKS,
  DECREASE_LOG_COUNT,
  INCREMENT_LOG_COUNT,
  SCRIPT_NO_LONGER_NEEDS_CONNECTION,
  PUT_CONNECTION,
  PUT_ENV,
  PUT_REMAINING,
  DECREASE_REMAINING,
  DEFER_ACTION,
  END_SCRIPT
} from '../src/actions';

test('defer action', () => {
  expect(deferAction({
    type: 'foo',
    payload: 'bar'
  })).toEqual({
    type: DEFER_ACTION,
    payload: {
      type: 'foo',
      payload: 'bar'
    }
  });
})

test('end script', () => {
  expect(endScript()).toEqual({
    type: END_SCRIPT
  })
})

test('put connection', () => {
  expect(putConnection('connection')).toEqual({
    type: PUT_CONNECTION,
    payload: 'connection'
  })
});

test('put env', () => {
  expect(putEnv('env')).toEqual({
    type: PUT_ENV,
    payload: 'env'
  })
});

test('put remaining', () => {
  expect(putRemaining(60)).toEqual({
    type: PUT_REMAINING,
    payload: 60
  })
});

test('decrease remaining', () => {
  expect(decreaseRemaining()).toEqual({
    type: DECREASE_REMAINING
  })
});

test('get tasks and end on no actions', () => {
  expect(getTasks(true)).toEqual({
    type: GET_TASKS,
    meta: {
      isInitial: true
    }
  });
});

test('get tasks and do not end on no actions', () => {
  expect(getTasks(false)).toEqual({
    type: GET_TASKS,
    meta: {
      isInitial: false
    }
  });
});
import {
  putConnection,
  putEnv,
  increaseExecutionCount,
  decreaseExecutionCount,
  putRemaining,
  decreaseRemaining,
  getTasks,
  endScript,
  deferAction,
  GET_TASKS,
  PUT_CONNECTION,
  PUT_ENV,
  INCREASE_EXECUTION_COUNT,
  DECREASE_EXECUTION_COUNT,
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

test('increase execution count', () => {
  expect(increaseExecutionCount()).toEqual({
    type: INCREASE_EXECUTION_COUNT
  })
});

test('decrease execution count', () => {
  expect(decreaseExecutionCount()).toEqual({
    type: DECREASE_EXECUTION_COUNT
  })
});

test('get tasks and end on no actions', () => {
  expect(getTasks(5, true)).toEqual({
    type: GET_TASKS,
    payload: 5,
    meta: {
      endOnNoActions: true
    }
  });
});

test('get tasks and do not end on no actions', () => {
  expect(getTasks(5, false)).toEqual({
    type: GET_TASKS,
    payload: 5,
    meta: {
      endOnNoActions: false
    }
  });
});
import {
  putConnection,
  putEnv,
  increaseExecutionCount,
  decreaseExecutionCount,
  putRemaining,
  decreaseRemaining,
  getTasks,
  GET_TASKS,
  PUT_CONNECTION,
  PUT_ENV,
  INCREASE_EXECUTION_COUNT,
  DECREASE_EXECUTION_COUNT,
  PUT_REMAINING,
  DECREASE_REMAINING
} from '../src/actions';

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

test('get tasks', () => {
  expect(getTasks(5)).toEqual({
    type: GET_TASKS,
    payload: 5
  });
})
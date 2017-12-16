import {
  putConnection,
  putEnv,
  putCallback,
  endComputation,
  PUT_CONNECTION,
  PUT_ENV,
  PUT_CALLBACK,
  END_COMPUTATION
} from '../src/actions';

test('put connection works', () => {
  expect(putConnection('connection')).toEqual({
    type: PUT_CONNECTION,
    payload: 'connection'
  })
});

test('put env works', () => {
  expect(putEnv('env')).toEqual({
    type: PUT_ENV,
    payload: 'env'
  })
});

test('put callback works', () => {
  expect(putCallback('callback')).toEqual({
    type: PUT_CALLBACK,
    payload: 'callback'
  });
});

test('end computation with error works', () => {
  expect(endComputation('foo', 'bar')).toEqual({
    type: END_COMPUTATION,
    payload: 'foo',
    error: 'bar'
  });
});

test('end computation without error works', () => {
  expect(endComputation('foo')).toEqual({
    type: END_COMPUTATION,
    payload: 'foo'
  });
});
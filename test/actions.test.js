import {
  putConnection,
  putEnv,
  putCallback,
  endLambda,
  PUT_CONNECTION,
  PUT_ENV,
  PUT_CALLBACK,
  END_LAMBDA
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

test('end lambda with error works', () => {
  expect(endLambda('foo', 'bar')).toEqual({
    type: END_LAMBDA,
    payload: 'foo',
    error: 'bar'
  });
});

test('end lambda without error works', () => {
  expect(endLambda('foo')).toEqual({
    type: END_LAMBDA,
    payload: 'foo'
  });
});
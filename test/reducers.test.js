import {
  putConnection,
  putEnv,
  putCallback,
} from '../src/actions';

import reducer from '../src/reducers';

test('reducer works', () => {
  expect(reducer(reducer(reducer({}, putConnection('connection')), putEnv('env')), putCallback('callback'))).toEqual({
    env: 'env',
    connection: 'connection',
    callback: 'callback',
  });
});

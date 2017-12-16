import { combineReducers } from 'redux';
import {
  PUT_ENV,
  PUT_CONNECTION,
  PUT_CALLBACK
} from './actions';

const simpleReducer = type => (state = null, action) => {
  switch (action.type) {
    case type:
      return action.payload;
    default:
      return state;
  }
}

export default combineReducers({
  env: simpleReducer(PUT_ENV),
  connection: simpleReducer(PUT_CONNECTION),
  callback: simpleReducer(PUT_CALLBACK)
});
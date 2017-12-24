import { combineReducers } from 'redux';
import {
  PUT_ENV,
  PUT_CONNECTION,
  PUT_REMAINING,
  DECREASE_REMAINING,
} from './actions';

const simpleReducer = type => (state = null, action) => {
  switch (action.type) {
    case type:
      return action.payload;
    default:
      return state;
  }
}

const remaining = (state = 0, action) => {
  switch (action.type) {
    case PUT_REMAINING:
      return action.payload;
    case DECREASE_REMAINING:
      return state - 1;
    default:
      return state;
  }
}


export default combineReducers({
  env: simpleReducer(PUT_ENV),
  connection: simpleReducer(PUT_CONNECTION),
  remaining
});
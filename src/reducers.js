import { combineReducers } from 'redux';
import {
  PUT_ENV,
  PUT_CONNECTION,
  PUT_REMAINING,
  DECREASE_REMAINING,
  INCREASE_EXECUTION_COUNT,
  DECREASE_EXECUTION_COUNT,
  END_SCRIPT,
  SCRIPT_NO_LONGER_NEEDS_CONNECTION,
  DECREASE_LOG_COUNT,
  INCREMENT_LOG_COUNT
} from './actions';

const simpleReducer = type => (state = null, action) => {
  switch (action.type) {
    case type:
      return action.payload;
    default:
      return state;
  }
}

const logCount = (state = 0, action) => {
  switch (action.type) {
    case INCREMENT_LOG_COUNT:
      return state + 1;
    case DECREASE_LOG_COUNT:
      return state - 1;
    default:
      return state;
  }
}

const scriptNoLongerNeedsConnection = (state = false, action) => {
  switch (action.type) {
    case SCRIPT_NO_LONGER_NEEDS_CONNECTION:
      return true;
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

const scriptEnded = (state = false, action) => {
  switch (action.type) {
    case END_SCRIPT:
      return true;
    default:
      return state;
  }
}

const executing = (state = 0, action) => {
  switch (action.type) {
    case INCREASE_EXECUTION_COUNT:
      return state + 1;
    case DECREASE_EXECUTION_COUNT:
      return state - 1;
    default:
      return state;
  }
}

export default combineReducers({
  env: simpleReducer(PUT_ENV),
  connection: simpleReducer(PUT_CONNECTION),
  remaining,
  executing,
  scriptEnded,
  logCount,
  scriptNoLongerNeedsConnection
});
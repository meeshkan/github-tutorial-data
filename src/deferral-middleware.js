import {
  increaseExecutionCount,
  decreaseExecutionCount,
  decreaseRemaining,
  deferAction,
  doCleanup,
  GET_COMMIT,
  GET_COMMITS,
  GET_LAST,
  GET_REPO,
  GET_REPOS
} from './actions';

import {
  INSERT_DEFERRED_STMT
} from './sql';

import uuidv4 from 'uuid/v4';

export default store => next => action => {
  switch (action.type) {
    case GET_REPO:
    case GET_REPOS:
    case GET_LAST:
    case GET_COMMIT:
    case GET_COMMITS:
      const {
        remaining
      } = store.getState();
      // we begin execution
      store.dispatch(increaseExecutionCount());
      store.dispatch(decreaseRemaining());
      if (remaining > 0) {
        console.log(`remaining ${remaining} and letting action through`);
        // if we have remaining capacity, we decrease capacity by one and execute
        // because getState() and store.dispatch will be run on the same node tick,
        // we can be confident that there will not be concurrency issues
        next(action);
      } else {
        console.log(`remaining ${remaining} and deferring action`);
        // we defer the action
        store.dispatch(deferAction(action));
      }
      break;
    default:
      next(action);
  }
}
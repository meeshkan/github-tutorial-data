import {
  END_SCRIPT
} from './actions';

import {
  INSERT_DEFERRED_STMT
} from './sql';

import uuidv4 from 'uuid/v4';

export default store => next => action => {
  switch (action.type) {
    case END_SCRIPT:
      const {
        scriptEnded
      } = store.getState();
      if (scriptEnded) {
        return;
      }
      console.log("sending end script action to middleware");
      // cascade to default otherwise
    default:
      next(action);
  }
}
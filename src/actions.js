export const GET_REPOS = "GET_REPOS";
export const GET_REPO = "GET_REPO";
export const GET_LAST = "GET_LAST";
export const GET_COMMITS = "GET_COMMITS";
export const GET_COMMIT = "GET_COMMIT";
export const PUT_CONNECTION = "PUT_CONNECTION";
export const PUT_ENV = "PUT_ENV";
export const GET_TASKS = "GET_TASKS";
export const PUT_REMAINING = "PUT_REMAINING";
export const DECREASE_REMAINING = "DECREASE_REMAINING";
export const INCREASE_EXECUTION_COUNT = "INCREASE_EXECUTION_COUNT";
export const DECREASE_EXECUTION_COUNT = "DECREASE_EXECUTION_COUNT";
export const DO_CLEANUP = "DO_CLEANUP";
export const END_SCRIPT = "END_SCRIPT";
export const DEFER_ACTION = "DEFER_ACTION";
export const SCRIPT_NO_LONGER_NEEDS_CONNECTION = "SCRIPT_NO_LONGER_NEEDS_CONNECTION";
export const INCREMENT_LOG_COUNT = "INCREMENT_LOG_COUNT";
export const DECREASE_LOG_COUNT = "DECREASE_LOG_COUNT";
export const GET_REPO_SUCCESS = "GET_REPO_SUCCESS";
export const GET_REPO_FAILURE = "GET_REPO_FAILURE";
export const GET_REPOS_SUCCESS = "GET_REPOS_SUCCESS";
export const GET_REPOS_FAILURE = "GET_REPOS_FAILURE";
export const GET_LAST_SUCCESS = "GET_LAST_SUCCESS";
export const GET_LAST_FAILURE = "GET_LAST_FAILURE";
export const GET_COMMIT_SUCCESS = "GET_COMMIT_SUCCESS";
export const GET_COMMIT_FAILURE = "GET_COMMIT_FAILURE";
export const GET_COMMITS_SUCCESS = "GET_COMMITS_SUCCESS";
export const GET_COMMITS_FAILURE = "GET_COMMITS_FAILURE";
export const GET_TASKS_SUCCESS = "GET_TASKS_SUCCESS";
export const GET_TASKS_FAILURE = "GET_TASKS_FAILURE";
export const DEFER_ACTION_SUCCESS = "DEFER_ACTION_SUCCESS";
export const DEFER_ACTION_FAILURE = "DEFER_ACTION_FAILURE";
export const SPAWN_SERVER_SUCCESS = "SPAWN_SERVER_SUCCESS";
export const END_SCRIPT_FAILURE = "END_SCRIPT_FAILURE";

export const deferAction = payload => ({
  type: DEFER_ACTION,
  payload
});

export const endScript = () => ({
  type: END_SCRIPT
});

export const doCleanup = () => ({
  type: DO_CLEANUP
});

export const initialAction = (since, uuid) => ({
  type: GET_REPOS,
  payload: {
    _computationSince: since
  },
  meta: {
    uuid
  }
});

export const increaseExecutionCount = () => ({
  type: INCREASE_EXECUTION_COUNT
});

export const decreaseExecutionCount = () => ({
  type: DECREASE_EXECUTION_COUNT
});

export const putRemaining = payload => ({
  type: PUT_REMAINING,
  payload
});

export const decreaseRemaining = () => ({
  type: DECREASE_REMAINING
});

export const getTasks = (payload, endOnNoActions) =>({
  type: GET_TASKS,
  payload,
  meta: {
    endOnNoActions
  }
});

export const putConnection = payload => ({
  type: PUT_CONNECTION,
  payload
});

export const putEnv = payload => ({
  type: PUT_ENV,
  payload
});

export const scriptNoLongerNeedsConnection = () => ({
  type: SCRIPT_NO_LONGER_NEEDS_CONNECTION
});

export const incrementLogCount = () => ({
  type: INCREMENT_LOG_COUNT
});

export const decreaseLogCount = () => ({
  type: DECREASE_LOG_COUNT
});

export const endComputation = (payload, error) => ({
  type: END_COMPUTATION,
  payload,
  ...(error ? {error} : {})
});
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

export const initialAction = since => ({
  type: GET_REPOS,
  payload: {
    _computationSince: since
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

export const getTasks = payload =>({
  type: GET_TASKS,
  payload
});

export const putConnection = payload => ({
  type: PUT_CONNECTION,
  payload
});

export const putEnv = payload => ({
  type: PUT_ENV,
  payload
});

export const endComputation = (payload, error) => ({
  type: END_COMPUTATION,
  payload,
  ...(error ? {error} : {})
});
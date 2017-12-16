export const GET_REPOS = "GET_REPOS";
export const GET_REPO = "GET_REPO";
export const GET_LAST = "GET_LAST";
export const GET_COMMITS = "GET_COMMITS";
export const GET_COMMIT = "GET_COMMIT";
export const PUT_CONNECTION = "PUT_CONNECTION";
export const PUT_ENV = "PUT_ENV";
export const PUT_CALLBACK = "PUT_CALLBACK";
export const END_LAMBDA = "END_LAMBDA";

export const putConnection = connection => ({
  type: PUT_CONNECTION,
  payload: connection
});

export const putEnv = env => ({
  type: PUT_ENV,
  payload: env
});

export const putCallback = callback => ({
  type: PUT_CALLBACK,
  payload: callback
});

export const endLambda = (payload, error) => ({
  type: END_LAMBDA,
  payload,
  ...(error ? {error} : {})
});
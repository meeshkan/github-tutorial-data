import {
  GET_LAST,
  GET_REPOS,
  GET_REPO,
  GET_COMMITS,
  GET_COMMIT,
  GET_REPO_SUCCESS,
  GET_REPO_FAILURE,
  GET_REPOS_SUCCESS,
  GET_REPOS_FAILURE,
  GET_LAST_SUCCESS,
  GET_LAST_FAILURE,
  GET_COMMIT_SUCCESS,
  GET_COMMIT_FAILURE,
  GET_COMMITS_SUCCESS,
  GET_COMMITS_FAILURE,
  GET_TASKS_SUCCESS,
  GET_TASKS_FAILURE,
  DEFER_ACTION_SUCCESS,
  DEFER_ACTION_FAILURE,
  SPAWN_SERVER_SUCCESS,
  END_SCRIPT_FAILURE,
  incrementLogCount,
  decreaseLogCount
} from './actions';

import {
  GET_COMMITS_LOG_INSERT_STMT,
  GET_COMMIT_LOG_INSERT_STMT,
  GET_REPOS_LOG_INSERT_STMT,
  GET_REPO_LOG_INSERT_STMT,
  GET_LAST_LOG_INSERT_STMT,
  INSERT_END_SCRIPT_ERROR_STMT,
  INSERT_SPAWN_SERVER_LOG_STMT,
  INSERT_GET_TASKS_STMT,
  INSERT_GET_TASKS_FAILURE_STMT
} from './sql';

import {
  call,
  put,
  select,
  takeEvery,
  race,
  take
} from 'redux-saga/effects';

import {
  sqlPromise
} from './util';

import AWS from 'aws-sdk';

export const stateSelector = $ => $;

export const makeTimestamp = () => new Date().getTime();

export function* deferredActionLogSideEffect(action) {
  const {
    payload,
    error
  } = action;
  const fn = action.payload.type === GET_LAST ?
    deferredGetLastLoggingSideEffect : action.payload.type === GET_REPOS ?
    deferredGetReposLoggingSideEffect : action.payload.type ===  GET_REPO ?
    deferredGetRepoLoggingSideEffect : action.payload.type === GET_COMMITS ?
    deferredGetCommitsLoggingSideEffect : action.payload.type === GET_COMMIT ?
    deferredGetCommitLoggingSideEffect : (() =>
      {throw new Error(`unknown type ${payload.type}`)})();
  yield call(fn, {
    ...payload,
    ...(error ? { error } : {})
  });
}

export function* getTasksSuccessSideEffect(action) {
  const {
    connection,
    env
  } = yield select(stateSelector);
  if (!env.WRITE_DEBUG_LOGS_TO_DB || !JSON.parse(env.WRITE_DEBUG_LOGS_TO_DB)) {
    return;
  }
  const {
    payload: {
      asked,
      got
    }
  } = action;
  yield put(incrementLogCount());
  try {
    const timestamp = yield call(makeTimestamp);
    yield call(sqlPromise, connection, INSERT_GET_TASKS_STMT, [env.GITHUB_TUTORIAL_UNIQUE_ID, asked, got, timestamp]);
  } catch (e) {
    console.error(e);
  } finally {
    yield put(decreaseLogCount());
  }
}

export function* getTasksFailureSideEffect(action) {
  const {
    connection,
    env
  } = yield select(stateSelector);
  if (!env.WRITE_DEBUG_LOGS_TO_DB || !JSON.parse(env.WRITE_DEBUG_LOGS_TO_DB)) {
    return;
  }
  const {
    error
  } = action;
  yield put(incrementLogCount());
  try {
    const timestamp = yield call(makeTimestamp);
    yield call(sqlPromise, connection, INSERT_GET_TASKS_FAILURE_STMT, [env.GITHUB_TUTORIAL_UNIQUE_ID, error.stack, timestamp]);
  } catch (e) {
    console.error(e);
  } finally {
    yield put(decreaseLogCount());
  }
}

export function* spawnServerLogSideEffect(action) {
  const {
    connection,
    env
  } = yield select(stateSelector);
  if (!env.WRITE_DEBUG_LOGS_TO_DB || !JSON.parse(env.WRITE_DEBUG_LOGS_TO_DB)) {
    return;
  }
  const {
    payload
  } = action;
  yield put(incrementLogCount());
  try {
    const timestamp = yield call(makeTimestamp);
    yield call(sqlPromise, connection, INSERT_SPAWN_SERVER_LOG_STMT, [env.GITHUB_TUTORIAL_UNIQUE_ID, payload, timestamp]);
  } catch (e) {
    console.error(e);
  } finally {
    yield put(decreaseLogCount());
  }
}

export function* endScriptErrorSideEffect(action) {
  const {
    connection,
    env
  } = yield select(stateSelector);
  if (!env.WRITE_DEBUG_LOGS_TO_DB || !JSON.parse(env.WRITE_DEBUG_LOGS_TO_DB)) {
    return;
  }
  const {
    error
  } = action;
  yield put(incrementLogCount());
  try {
    const timestamp = yield call(makeTimestamp);
    yield call(sqlPromise, connection, INSERT_END_SCRIPT_ERROR_STMT, [env.GITHUB_TUTORIAL_UNIQUE_ID, error.stack, timestamp]);
  } catch (e) {
    console.error(e);
  } finally {
    yield put(decreaseLogCount());
  }
}

const makeLoggingSideEffect = (insertStmt, payloadDestructurer, deferred) => function*(action) {
  const {
    connection,
    env
  } = yield select(stateSelector);
  if (!env.WRITE_DEBUG_LOGS_TO_DB || !JSON.parse(env.WRITE_DEBUG_LOGS_TO_DB)) {
    return;
  }
  const {
    payload,
    meta: {
      uuid
    },
    error
  } = action;
  const args = payloadDestructurer(payload);
  yield put(incrementLogCount());
  try {
    const timestamp = yield call(makeTimestamp);
    yield call(sqlPromise, connection, insertStmt, args.concat([uuid, JSON.stringify(payload), env.GITHUB_TUTORIAL_UNIQUE_ID, timestamp, error ? error.stack : null, deferred ? 1 : 0]));
  } catch (e) {
    console.error(e);
  } finally {
    yield put(decreaseLogCount());
  }
}

const _getLastLoggingSideEffect = deferred => makeLoggingSideEffect(GET_LAST_LOG_INSERT_STMT, ({
  _computationId,
  _computationOwner,
  _computationRepo
}) => [
  _computationId,
  _computationOwner,
  _computationRepo
], deferred);

const _getReposLoggingSideEffect = deferred => makeLoggingSideEffect(GET_REPOS_LOG_INSERT_STMT, ({
  _computationSince,
  _computationReposCount
}) => [
  _computationSince,
  _computationReposCount
], deferred);

const _getRepoLoggingSideEffect = deferred => makeLoggingSideEffect(GET_REPO_LOG_INSERT_STMT, ({
  _computationOwner,
  _computationRepo
}) => [
  _computationOwner,
  _computationRepo
], deferred);

const _getCommitsLoggingSideEffect = deferred => makeLoggingSideEffect(GET_COMMITS_LOG_INSERT_STMT, ({
  _computationPage,
  _computationCommitCount,
  _computationId,
  _computationOwner,
  _computationRepo
}) => [
  _computationPage,
  _computationCommitCount,
  _computationId,
  _computationOwner,
  _computationRepo
], deferred);

const _getCommitLoggingSideEffect = deferred => makeLoggingSideEffect(GET_COMMIT_LOG_INSERT_STMT, ({
  _computationId,
  _computationSHA,
  _computationOwner,
  _computationRepo
}) => [
  _computationId,
  _computationSHA,
  _computationOwner,
  _computationRepo
], deferred);

export const getLastLoggingSideEffect = _getLastLoggingSideEffect(false);
export const getReposLoggingSideEffect = _getReposLoggingSideEffect(false);
export const getRepoLoggingSideEffect = _getRepoLoggingSideEffect(false);
export const getCommitsLoggingSideEffect = _getCommitsLoggingSideEffect(false);
export const getCommitLoggingSideEffect = _getCommitLoggingSideEffect(false);
export const deferredGetLastLoggingSideEffect = _getLastLoggingSideEffect(true);
export const deferredGetReposLoggingSideEffect = _getReposLoggingSideEffect(true);
export const deferredGetRepoLoggingSideEffect = _getRepoLoggingSideEffect(true);
export const deferredGetCommitsLoggingSideEffect = _getCommitsLoggingSideEffect(true);
export const deferredGetCommitLoggingSideEffect = _getCommitLoggingSideEffect(true);

function* loggingSaga() {
  yield takeEvery(GET_LAST_SUCCESS, getLastLoggingSideEffect);
  yield takeEvery(GET_LAST_FAILURE, getLastLoggingSideEffect);
  yield takeEvery(GET_REPOS_SUCCESS, getReposLoggingSideEffect);
  yield takeEvery(GET_REPOS_FAILURE, getReposLoggingSideEffect);
  yield takeEvery(GET_REPO_SUCCESS, getRepoLoggingSideEffect);
  yield takeEvery(GET_REPO_FAILURE, getRepoLoggingSideEffect);
  yield takeEvery(GET_COMMITS_SUCCESS, getCommitsLoggingSideEffect);
  yield takeEvery(GET_COMMITS_FAILURE, getCommitsLoggingSideEffect);
  yield takeEvery(GET_COMMIT_SUCCESS, getCommitLoggingSideEffect);
  yield takeEvery(GET_COMMIT_FAILURE, getCommitLoggingSideEffect);
  yield takeEvery(DEFER_ACTION_SUCCESS, deferredActionLogSideEffect);
  yield takeEvery(DEFER_ACTION_FAILURE, deferredActionLogSideEffect);
  yield takeEvery(SPAWN_SERVER_SUCCESS,  spawnServerLogSideEffect);
  yield takeEvery(END_SCRIPT_FAILURE, endScriptErrorSideEffect);
  yield takeEvery(GET_TASKS_SUCCESS, getTasksSuccessSideEffect);
  yield takeEvery(GET_TASKS_FAILURE, getTasksFailureSideEffect);
}

export default loggingSaga;
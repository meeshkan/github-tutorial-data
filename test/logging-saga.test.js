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
  END_SCRIPT_FAILURE
} from '../src/actions';

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
} from '../src/sql';

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
} from '../src/util';

import loggingSaga, {
  getLastLoggingSideEffect,
  getReposLoggingSideEffect,
  getRepoLoggingSideEffect,
  getCommitsLoggingSideEffect,
  getCommitLoggingSideEffect,
  deferredGetLastLoggingSideEffect,
  deferredGetReposLoggingSideEffect,
  deferredGetRepoLoggingSideEffect,
  deferredGetCommitsLoggingSideEffect,
  deferredGetCommitLoggingSideEffect,
  deferredActionLogSideEffect,
  spawnServerLogSideEffect,
  endScriptErrorSideEffect,
  getTasksSuccessSideEffect,
  getTasksFailureSideEffect,
  makeTimestamp,
  stateSelector
} from '../src/logging-saga';


const CONNECTION = 'connection';
const ENV = {
  WRITE_DEBUG_LOGS_TO_DB: "true",
  GITHUB_TUTORIAL_UNIQUE_ID: 'my-unique-id',
  MONITOR_FUNCTION: 'StopIt',
  GITHUB_TUTORIAL_AWS_REGION: "us-east-1",
  PACKAGE_URL: 'http://foo.bar.com/package.zip',
  PACKAGE_NAME: 'package.zip',
  PACKAGE_FOLDER: 'package',
  GITHUB_API: 'https://api.github.com',
  MAX_COMMITS: '59',
  START_REPO: '1234567',
  MAX_REPOS: '60001',
  MAX_COMPUTATIONS: '949',
  GITHUB_TUTORIAL_IMAGE_ID: 'ami-3511515',
  GITHUB_TUTORIAL_DRY_RUN: "true",
  MY_SQL_PORT: '3306',
  MY_SQL_HOST: 'my.sql.cluster',
  MY_SQL_USERNAME: 'meeshkan',
  MY_SQL_PASSWORD: 'octocatrules',
  GITHUB_TUTORIAL_SPOT_PRICE: '0.0041',
  GITHUB_TUTORIAL_SUBNET_ID: 'pfjegngwe',
  GITHUB_TUTORIAL_SECURITY_GROUP_ID: 'lajfefwfk',
  GITHUB_TUTORIAL_IAM_INSTANCE_ARN: 'arn:foo-bar',
  GITHUB_TUTORIAL_KEY_NAME: 'my-key-name',
  MY_SQL_DATABASE: 'github',
  MY_SQL_SSL: 'some ssl scheme',
  INVOCATION_TYPE: 'Event'
};

const state = {
  connection: CONNECTION,
  env: ENV
}

test('deferred action log side effect for get last', () => {
  const action = {
    type: DEFER_ACTION_SUCCESS,
    payload: {
      type: GET_LAST,
      payload: 'bar',
      meta: {
        uuid: 'a'
      }
    },
    meta: {
      uuid: 'happiness'
    }
  };
  const gen = deferredActionLogSideEffect(action);
  expect(gen.next().value).toEqual(call(deferredGetLastLoggingSideEffect, {
    type: GET_LAST,
    payload: 'bar',
    meta: {
      uuid: 'a'
    }
  }, 'happiness'));
  expect(gen.next().done).toBe(true);
});

test('deferred action log side effect for get repos', () => {
  const action = {
    type: DEFER_ACTION_SUCCESS,
    payload: {
      type: GET_REPOS,
      payload: 'bar',
      meta: {
        uuid: 'a'
      }
    },
    meta: {
      uuid: 'serenity'
    }
  };
  const gen = deferredActionLogSideEffect(action);
  expect(gen.next().value).toEqual(call(deferredGetReposLoggingSideEffect, {
    type: GET_REPOS,
    payload: 'bar',
    meta: {
      uuid: 'a'
    }
  }, 'serenity'));
  expect(gen.next().done).toBe(true);
});

test('deferred action log side effect for get repo', () => {
  const action = {
    type: DEFER_ACTION_SUCCESS,
    payload: {
      type: GET_REPO,
      payload: 'bar',
      meta: {
        uuid: 'a'
      }
    },
    meta: {
      uuid: 'strength'
    }
  };
  const gen = deferredActionLogSideEffect(action);
  expect(gen.next().value).toEqual(call(deferredGetRepoLoggingSideEffect, {
    type: GET_REPO,
    payload: 'bar',
    meta: {
      uuid: 'a'
    }
  }, 'strength'));
  expect(gen.next().done).toBe(true);
});

test('deferred action log side effect for get commit', () => {
  const action = {
    type: DEFER_ACTION_SUCCESS,
    payload: {
      type: GET_COMMIT,
      payload: 'bar',
      meta: {
        uuid: 'a'
      }
    },
    meta: {
      uuid: 'tenacity'
    }
  };
  const gen = deferredActionLogSideEffect(action);
  expect(gen.next().value).toEqual(call(deferredGetCommitLoggingSideEffect, {
    type: GET_COMMIT,
    payload: 'bar',
    meta: {
      uuid: 'a'
    }
  }, 'tenacity'));
  expect(gen.next().done).toBe(true);
});


test('deferred action log side effect for get commits', () => {
  const error = new Error('foo');
  const action = {
    type: DEFER_ACTION_SUCCESS,
    payload: {
      type: GET_COMMITS,
      payload: 'bar',
      meta: {
        uuid: 'a'
      },
    },
    meta: {
      uuid: 'scrappiness'
    },
    error
  };
  const gen = deferredActionLogSideEffect(action);
  expect(gen.next().value).toEqual(call(deferredGetCommitsLoggingSideEffect, {
    type: GET_COMMITS,
    payload: 'bar',
    meta: {
      uuid: 'a'
    },
    error
  }, 'scrappiness'));
  expect(gen.next().done).toBe(true);
});

test('get tasks success', () => {
  const gen = getTasksSuccessSideEffect({
    payload: {
      asked: 5,
      got: 3
    },
    meta: {
      uuid: 'greatness'
    }
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(makeTimestamp));
  expect(gen.next(100).value).toEqual(call(sqlPromise, CONNECTION, INSERT_GET_TASKS_STMT, ['my-unique-id', 5, 3, 100]));
  expect(gen.next().value).toEqual(put({
    type: 'greatness_LOGGED'
  }));
  expect(gen.next().done).toBe(true);
});

test('get tasks failure', () => {
  const error = new Error('foo');
  const gen = getTasksFailureSideEffect({
    error,
    meta: {
      uuid: 'ferocity'
    }
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(makeTimestamp));
  expect(gen.next(100).value).toEqual(call(sqlPromise, CONNECTION, INSERT_GET_TASKS_FAILURE_STMT, ['my-unique-id', error.stack, 100]));
  expect(gen.next().value).toEqual(put({
    type: 'ferocity_LOGGED'
  }));
  expect(gen.next().done).toBe(true);
});

test('spawn server log success', () => {
  const gen = spawnServerLogSideEffect({
    payload: 'spawned server id'
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(makeTimestamp));
  expect(gen.next(100).value).toEqual(call(sqlPromise, CONNECTION, INSERT_SPAWN_SERVER_LOG_STMT, ['my-unique-id', 'spawned server id', 100]));
  expect(gen.next().value).toEqual(put({
    type: 'spawned server id_LOGGED'
  }));
  expect(gen.next().done).toBe(true);
});

test('end script error', () => {
  const error = new Error('bar');
  const gen = endScriptErrorSideEffect({
    error,
    meta: {
      uuid: 'gumption'
    }
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(makeTimestamp));
  expect(gen.next(100).value).toEqual(call(sqlPromise, CONNECTION, INSERT_END_SCRIPT_ERROR_STMT, ['my-unique-id', error.stack, 100]));
  expect(gen.next().value).toEqual(put({
    type: 'gumption_LOGGED'
  }));
  expect(gen.next().done).toBe(true);
});

test('deferred get repos success', () => {
  const gen = deferredGetReposLoggingSideEffect({
    payload: {
      _computationSince: 1000,
      _computationReposCount: 5
    },
    meta: {
      uuid: 'ugh'
    }
  }, 'craziness');
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(makeTimestamp));
  expect(gen.next(100).value).toEqual(call(sqlPromise, CONNECTION, GET_REPOS_LOG_INSERT_STMT, [1000, 5, 'ugh', JSON.stringify({
    _computationSince: 1000,
    _computationReposCount: 5
  }), 'my-unique-id', 100, null, 1]));
  expect(gen.next().value).toEqual(put({
    type: 'craziness_LOGGED'
  }));
  expect(gen.next().done).toBe(true);
});

test('deferred get repo failure', () => {
  const error = new Error('my error');
  const gen = deferredGetRepoLoggingSideEffect({
    payload: {
      _computationOwner: 'me',
      _computationRepo: 'my-awesome-repo'
    },
    meta: {
      uuid: 'an-id'
    },
    error
  }, 'compassion');
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(makeTimestamp));
  expect(gen.next(100).value).toEqual(call(sqlPromise, CONNECTION, GET_REPO_LOG_INSERT_STMT, ['me', 'my-awesome-repo', 'an-id', JSON.stringify({
    _computationOwner: 'me',
    _computationRepo: 'my-awesome-repo'
  }), 'my-unique-id', 100, error.stack, 1]));
  expect(gen.next().value).toEqual(put({
    type: 'compassion_LOGGED'
  }));
  expect(gen.next().done).toBe(true);
});

test('get last success', () => {
  const gen = getLastLoggingSideEffect({
    payload: {
      _computationId: 10,
      _computationOwner: 'jane',
      _computationRepo: 'doe'
    },
    meta: {
      uuid: 'meta-id'
    }
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(makeTimestamp));
  expect(gen.next(123).value).toEqual(call(sqlPromise, CONNECTION, GET_LAST_LOG_INSERT_STMT, [10, 'jane', 'doe', 'meta-id', JSON.stringify({
    _computationId: 10,
    _computationOwner: 'jane',
    _computationRepo: 'doe'
  }), 'my-unique-id', 123, null, 0]));
  expect(gen.next().value).toEqual(put({
    type: 'meta-id_LOGGED'
  }));
  expect(gen.next().done).toBe(true);
});

test('get commits failure', () => {
  const error = new Error('shit hit the fan');
  const gen = getCommitsLoggingSideEffect({
    payload: {
      _computationPage: 47,
      _computationCommitCount: 12,
      _computationId: 103,
      _computationOwner: 'susan',
      _computationRepo: 'smith'
    },
    meta: {
      uuid: 'another-id'
    },
    error
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(makeTimestamp));
  expect(gen.next(123).value).toEqual(call(sqlPromise, CONNECTION, GET_COMMITS_LOG_INSERT_STMT, [
    47,
    12,
    103,
    'susan',
    'smith',
    'another-id',
    JSON.stringify({
      _computationPage: 47,
      _computationCommitCount: 12,
      _computationId: 103,
      _computationOwner: 'susan',
      _computationRepo: 'smith'
    }),
    'my-unique-id',
    123,
    error.stack,
    0
  ]));
  expect(gen.next().value).toEqual(put({
    type: 'another-id_LOGGED'
  }));
  expect(gen.next().done).toBe(true);
});


test('get commit failure', () => {
  const error = new Error('infinite sadness');
  const gen = getCommitLoggingSideEffect({
    payload: {
      _computationId: 123,
      _computationSHA: 'sha',
      _computationOwner: 'bob',
      _computationRepo: 'jones'
    },
    meta: {
      uuid: 'famous-id'
    },
    error
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(makeTimestamp));
  expect(gen.next(123).value).toEqual(call(sqlPromise, CONNECTION, GET_COMMIT_LOG_INSERT_STMT, [
    123,
    'sha',
    'bob',
    'jones',
    'famous-id',
    JSON.stringify({
      _computationId: 123,
      _computationSHA: 'sha',
      _computationOwner: 'bob',
      _computationRepo: 'jones'
    }),
    'my-unique-id',
    123,
    error.stack,
    0
  ]));
  expect(gen.next().value).toEqual(put({
    type: 'famous-id_LOGGED'
  }));
  expect(gen.next().done).toBe(true);
});

test('logging saga', () => {
  const gen = loggingSaga();
  const fullSaga = [
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next()
  ].map(x => x.value);
  const sagaParts = [
    takeEvery(GET_LAST_SUCCESS, getLastLoggingSideEffect),
    takeEvery(GET_LAST_FAILURE, getLastLoggingSideEffect),
    takeEvery(GET_REPOS_SUCCESS, getReposLoggingSideEffect),
    takeEvery(GET_REPOS_FAILURE, getReposLoggingSideEffect),
    takeEvery(GET_REPO_SUCCESS, getRepoLoggingSideEffect),
    takeEvery(GET_REPO_FAILURE, getRepoLoggingSideEffect),
    takeEvery(GET_COMMITS_SUCCESS, getCommitsLoggingSideEffect),
    takeEvery(GET_COMMITS_FAILURE, getCommitsLoggingSideEffect),
    takeEvery(GET_COMMIT_SUCCESS, getCommitLoggingSideEffect),
    takeEvery(GET_COMMIT_FAILURE, getCommitLoggingSideEffect),
    takeEvery(DEFER_ACTION_SUCCESS, deferredActionLogSideEffect),
    takeEvery(DEFER_ACTION_FAILURE, deferredActionLogSideEffect),
    takeEvery(SPAWN_SERVER_SUCCESS, spawnServerLogSideEffect),
    takeEvery(END_SCRIPT_FAILURE, endScriptErrorSideEffect),
    takeEvery(GET_TASKS_SUCCESS, getTasksSuccessSideEffect),
    takeEvery(GET_TASKS_FAILURE, getTasksFailureSideEffect)
  ];
  let i = 0;
  for (; i < sagaParts.length; i++) {
    expect(fullSaga[i]).toEqual(sagaParts[i]);
  }
  expect(fullSaga.length).toBe(sagaParts.length);
  expect(gen.next().done).toBe(true);
});
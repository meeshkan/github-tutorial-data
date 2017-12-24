import axios from 'axios';
import uuidv4 from 'uuid/v4';

import {
  MOCK_GET_REPO_DATA,
  MOCK_GET_COMMIT_DATA,
  MOCK_GET_REPOS_DATA,
  MOCK_GET_COMMITS_DATA
} from './mock-data';

import githubSaga, {
  getRepoSideEffect,
  getCommitSideEffect,
  getLastSideEffect,
  getCommitsSideEffect,
  getReposSideEffect,
  getTasksSideEffect,
  deferActionSideEffect,
  doCleanup,
  stateSelector,
} from '../src/github-saga';

import {
  sqlPromise,
  destroy
} from '../src/util';

import {
  INSERT_REPO_STMT,
  INSERT_COMMIT_STMT,
  INSERT_DEFERRED_STMT,
  SELECT_DEFERRED_STMT,
  DELETE_DEFERRED_STMT,
  SELECT_UNFULFILLED_STMT,
  INCREASE_EXECUTING_STATEMENT,
  SELECT_EXECUTING_STATEMENT,
  DECREASE_EXECUTING_STATEMENT,
  CHANGE_UNFULFILLED_STATEMENT
} from '../src/sql';

import {
  call,
  put,
  select,
  takeEvery,
  take,
  race
} from 'redux-saga/effects';

import {
  GET_REPO,
  GET_REPO_SUCCESS,
  GET_REPO_FAILURE,
  GET_REPOS,
  GET_REPOS_SUCCESS,
  GET_REPOS_FAILURE,
  GET_LAST,
  GET_LAST_SUCCESS,
  GET_LAST_FAILURE,
  GET_COMMIT,
  GET_COMMIT_SUCCESS,
  GET_COMMIT_FAILURE,
  GET_COMMITS,
  GET_COMMITS_SUCCESS,
  GET_COMMITS_FAILURE,
  GET_TASKS,
  DECREASE_REMAINING,
  END_SCRIPT,
  DEFER_ACTION,
  DEFER_ACTION_SUCCESS,
  GET_TASKS_SUCCESS,
  getTasks,
  endScript
} from '../src/actions';

const CONNECTION = 'connection';
const ENV = {
  GITHUB_TUTORIAL_UNIQUE_ID: 'my-unique-id',
  WRITE_DEBUG_LOGS_TO_DB: "http://my.raven.url",
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


test('get repo side effect face plant', () => {
  const error = new Error('sad');
  const payload = {
    _computationOwner: 'Meeshkan',
    _computationRepo: 'redux-ize'
  };
  const action = {
    type: GET_REPO,
    payload,
    meta: {
      uuid: 'foo'
    }
  };
  const gen = getRepoSideEffect(action);
  gen.next();
  gen.next(state);
  expect(gen.throw(error).value).toEqual(put({
    type: GET_REPO_FAILURE,
    payload,
    meta: {
      uuid: 'foo'
    },
    error
  }));
  expect(gen.next().value).toEqual(take('foo_LOGGED'));
  expect(gen.next().value).toEqual(call(doCleanup, 'foo'));
  expect(gen.next().done).toBe(true);
});

test('get repo side effect', () => {
  const payload = {
    _computationOwner: 'Meeshkan',
    _computationRepo: 'redux-ize'
  };
  const action = {
    type: GET_REPO,
    payload,
    meta: {
      uuid: 'foo'
    }
  };
  const gen = getRepoSideEffect(action);
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(axios, 'https://api.github.com/repos/Meeshkan/redux-ize'));
  expect(gen.next({
    data: MOCK_GET_REPO_DATA
  }).value).toEqual(call(sqlPromise, CONNECTION, INSERT_REPO_STMT, [110536681, "Meeshkan", 32298527, "redux-ize", "Meeshkan/redux-ize", "JavaScript", 0, 4, 4, 1, 53, 1, 1, 0, 1, new Date("2017-11-29T15:18:57Z").getTime(), new Date("2017-11-13T10:55:26Z").getTime(), new Date("2017-12-12T13:38:56Z").getTime(), "Meeshkan", 32298527, "redux-ize", "Meeshkan/redux-ize", "JavaScript", 0, 4, 4, 1, 53, 1, 1, 0, 1, new Date("2017-11-29T15:18:57Z").getTime(), new Date("2017-11-13T10:55:26Z").getTime(), new Date("2017-12-12T13:38:56Z").getTime()]));
  expect(gen.next().value).toEqual(call(uuidv4));
  expect(gen.next('an-id').value).toEqual(put({
    type: GET_LAST,
    payload: {
      _computationId: 110536681,
      _computationOwner: "Meeshkan",
      _computationRepo: "redux-ize",
    },
    meta: {
      uuid: 'an-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: GET_REPO_SUCCESS,
    payload,
    meta: {
      uuid: 'foo'
    }
  }));
  let i = 0;
  for (; i < 2; i++) {
    expect(gen.next().value).toEqual(race({
      'an-id_DONE': take('an-id_DONE'),
      'foo_LOGGED': take('foo_LOGGED')
    }));
  }
  expect(gen.next().value).toEqual(call(doCleanup, 'foo'));
  expect(gen.next().done).toBe(true);
});

test('get commit side effect face plant', () => {
  const error = new Error('sad');
  const payload = {
    _computationId: 110536681,
    _computationSHA: "84d1bbf0643eacaf94685155cd53ae170b561e1b",
    _computationOwner: 'Meeshkan',
    _computationRepo: 'redux-ize'
  };
  const action = {
    type: GET_COMMIT,
    payload,
    meta: {
      uuid: 'foo'
    }
  };
  const gen = getCommitSideEffect(action);
  gen.next();
  gen.next(state);
  expect(gen.throw(error).value).toEqual(put({
    type: GET_COMMIT_FAILURE,
    payload,
    meta: {
      uuid: 'foo'
    },
    error
  }));
  expect(gen.next().value).toEqual(take('foo_LOGGED'));
  expect(gen.next().value).toEqual(call(doCleanup, 'foo'));
  expect(gen.next().done).toBe(true);
});

test('get commit side effect', () => {
  const payload = {
    _computationId: 110536681,
    _computationSHA: "84d1bbf0643eacaf94685155cd53ae170b561e1b",
    _computationOwner: 'Meeshkan',
    _computationRepo: 'redux-ize'
  };
  const action = {
    type: GET_COMMIT,
    payload,
    meta: {
      uuid: 'foo'
    }
  };
  const gen = getCommitSideEffect(action);
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(axios, 'https://api.github.com/repos/Meeshkan/redux-ize/commits/84d1bbf0643eacaf94685155cd53ae170b561e1b'));
  expect(gen.next({
    data: MOCK_GET_COMMIT_DATA
  }).value).toEqual(call(sqlPromise, CONNECTION, INSERT_COMMIT_STMT, ["84d1bbf0643eacaf94685155cd53ae170b561e1b", 110536681, "Mike Solomon", "mike@mikesolomon.org", new Date("2017-11-13T11:51:59Z").getTime(), "Mike Solomon", "mike@mikesolomon.org", new Date("2017-11-13T11:51:59Z").getTime(), "mikesol", 525350, "mikesol", 525350, 5455, 0, 5455, 24, 0, 24, 110536681, "Mike Solomon", "mike@mikesolomon.org", new Date("2017-11-13T11:51:59Z").getTime(), "Mike Solomon", "mike@mikesolomon.org", new Date("2017-11-13T11:51:59Z").getTime(), "mikesol", 525350, "mikesol", 525350, 5455, 0, 5455, 24, 0, 24]));
  expect(gen.next().value).toEqual(put({
    type: GET_COMMIT_SUCCESS,
    payload,
    meta: {
      uuid: 'foo'
    }
  }));
  expect(gen.next().value).toEqual(take('foo_LOGGED'));
  expect(gen.next().value).toEqual(call(doCleanup, 'foo'));
  expect(gen.next().done).toBe(true);
});

test('get last side effect face plant', () => {
  const error = new Error('sad');
  const payload = {
    _computationId: 110536681,
    _computationOwner: 'mikesol',
    _computationRepo: 'empty-repo'
  };
  const action = {
    type: GET_LAST,
    payload,
    meta: {
      uuid: 'bar'
    }
  };
  const gen = getLastSideEffect(action);
  gen.next();
  gen.next(state);
  expect(gen.throw(error).value).toEqual(put({
    type: GET_LAST_FAILURE,
    payload,
    meta: {
      uuid: 'bar'
    },
    error
  }));
  expect(gen.next().value).toEqual(take('bar_LOGGED'));
  expect(gen.next().value).toEqual(call(doCleanup, 'bar'));
  expect(gen.next().done).toBe(true);
});

test('get last side effect for empty repo', () => {
  const payload = {
    _computationId: 110536681,
    _computationOwner: 'mikesol',
    _computationRepo: 'empty-repo'
  };
  const action = {
    type: GET_LAST,
    payload,
    meta: {
      uuid: 'happy'
    }
  };
  const gen = getLastSideEffect(action);
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(axios, 'https://api.github.com/repos/mikesol/empty-repo/commits'));
  expect(gen.next({
    headers: {}
  }).value).toEqual(call(uuidv4));
  expect(gen.next().value).toEqual(put({
    type: GET_LAST_SUCCESS,
    payload,
    meta: {
      uuid: 'happy'
    }
  }));
  expect(gen.next().value).toEqual(race({
    'happy_LOGGED': take('happy_LOGGED')
  }));
  expect(gen.next().value).toEqual(call(doCleanup, 'happy'));
  expect(gen.next().done).toBe(true);
});

test('get last side effect', () => {
  const payload = {
    _computationId: 110536681,
    _computationOwner: 'redux-saga',
    _computationRepo: 'redux-saga'
  };
  const action = {
    type: GET_LAST,
    payload,
    meta: {
      uuid: 'foo'
    }
  };
  const gen = getLastSideEffect(action);
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(axios, 'https://api.github.com/repos/redux-saga/redux-saga/commits'));
  expect(gen.next({
    headers: {
      link: '<https://api.github.com/repositories/47071941/commits?page=2>; rel="next", <https://api.github.com/repositories/47071941/commits?page=47>; rel="last"'
    }
  }).value).toEqual(call(uuidv4));
  expect(gen.next('my-id').value).toEqual(put({
    type: GET_COMMITS,
    payload: {
      _computationId: 110536681,
      _computationOwner: "redux-saga",
      _computationRepo: "redux-saga",
      _computationCommitCount: 0,
      _computationPage: 47
    },
    meta: {
      uuid: 'my-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: GET_LAST_SUCCESS,
    payload,
    meta: {
      uuid: 'foo'
    }
  }));
  let i = 0;
  for(; i < 2; i++) {
    expect(gen.next().value).toEqual(race({
      'my-id_DONE': take('my-id_DONE'),
      'foo_LOGGED': take('foo_LOGGED')
    }));
  }
  expect(gen.next().value).toEqual(call(doCleanup, 'foo'));
  expect(gen.next().done).toBe(true);
});

test('get repos side effect face plant', () => {
  const error = new Error('sad');
  const payload = {
    _computationSince: 308249
  };
  const action = {
    type: GET_REPOS,
    payload,
    meta: {
      uuid: 'foo'
    }
  };
  const gen = getReposSideEffect(action);
  gen.next();
  gen.next(state);
  expect(gen.throw(error).value).toEqual(put({
    type: GET_REPOS_FAILURE,
    payload,
    meta: {
      uuid: 'foo'
    },
    error
  }));
  expect(gen.next().value).toEqual(take('foo_LOGGED'));
  expect(gen.next().value).toEqual(call(doCleanup, 'foo'));
  expect(gen.next().done).toBe(true);
});

test('get repos side effect', () => {
  const payload = {
    _computationSince: 308249
  };
  const action = {
    type: GET_REPOS,
    payload,
    meta: {
      uuid: 'foo'
    }
  };
  const gen = getReposSideEffect(action);
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(axios, 'https://api.github.com/repositories?since=308249'));
  expect(gen.next({
    headers: {
      link: '<https://api.github.com/repositories?since=308500>; rel="next", <https://api.github.com/repositories{?since}>; rel="first"'
    },
    data: MOCK_GET_REPOS_DATA
  }).value).toEqual(call(uuidv4));
  expect(gen.next('a-id').value).toEqual(call(uuidv4));
  expect(gen.next('b-id').value).toEqual(call(uuidv4));
  expect(gen.next('c-id').value).toEqual(call(uuidv4));
  expect(gen.next('d-id').value).toEqual(call(uuidv4));
  expect(gen.next('e-id').value).toEqual(call(uuidv4));
  expect(gen.next('f-id').value).toEqual(call(uuidv4));
  expect(gen.next('g-id').value).toEqual(call(uuidv4));
  expect(gen.next('h-id').value).toEqual(call(uuidv4));
  expect(gen.next('i-id').value).toEqual(call(uuidv4));
  expect(gen.next('j-id').value).toEqual(call(uuidv4));
  expect(gen.next('k-id').value).toEqual(call(uuidv4));
  expect(gen.next('l-id').value).toEqual(call(uuidv4));
  expect(gen.next('m-id').value).toEqual(call(uuidv4));
  expect(gen.next('n-id').value).toEqual(call(uuidv4));
  expect(gen.next('o-id').value).toEqual(call(uuidv4));
  expect(gen.next('p-id').value).toEqual(call(uuidv4));
  expect(gen.next('q-id').value).toEqual(call(uuidv4));
  expect(gen.next('r-id').value).toEqual(call(uuidv4));
  expect(gen.next('s-id').value).toEqual(call(uuidv4));
  expect(gen.next('t-id').value).toEqual(call(uuidv4));
  expect(gen.next('u-id').value).toEqual(call(uuidv4));
  expect(gen.next('v-id').value).toEqual(call(uuidv4));
  expect(gen.next('w-id').value).toEqual(call(uuidv4));
  expect(gen.next('x-id').value).toEqual(call(uuidv4));
  expect(gen.next('y-id').value).toEqual(call(uuidv4));
  expect(gen.next('z-id').value).toEqual(call(uuidv4));
  expect(gen.next('aa-id').value).toEqual(call(uuidv4));
  expect(gen.next('bb-id').value).toEqual(call(uuidv4));
  expect(gen.next('cc-id').value).toEqual(call(uuidv4));
  expect(gen.next('dd-id').value).toEqual(call(uuidv4));
  expect(gen.next('ee-id').value).toEqual(call(uuidv4));
  expect(gen.next('ff-id').value).toEqual(call(uuidv4));
  expect(gen.next('gg-id').value).toEqual(call(uuidv4));
  expect(gen.next('hh-id').value).toEqual(call(uuidv4));
  expect(gen.next('ii-id').value).toEqual(call(uuidv4));
  expect(gen.next('jj-id').value).toEqual(call(uuidv4));
  expect(gen.next('kk-id').value).toEqual(call(uuidv4));
  expect(gen.next('ll-id').value).toEqual(call(uuidv4));
  expect(gen.next('mm-id').value).toEqual(call(uuidv4));
  expect(gen.next('nn-id').value).toEqual(call(uuidv4));
  expect(gen.next('oo-id').value).toEqual(call(uuidv4));
  expect(gen.next('pp-id').value).toEqual(call(uuidv4));
  expect(gen.next('qq-id').value).toEqual(call(uuidv4));
  expect(gen.next('rr-id').value).toEqual(call(uuidv4));
  expect(gen.next('ss-id').value).toEqual(call(uuidv4));
  expect(gen.next('tt-id').value).toEqual(call(uuidv4));
  expect(gen.next('uu-id').value).toEqual(call(uuidv4));
  expect(gen.next('vv-id').value).toEqual(call(uuidv4));
  expect(gen.next('ww-id').value).toEqual(call(uuidv4));
  expect(gen.next('xx-id').value).toEqual(call(uuidv4));
  expect(gen.next('yy-id').value).toEqual(call(uuidv4));
  expect(gen.next('zz-id').value).toEqual(call(uuidv4));
  expect(gen.next('aaa-id').value).toEqual(call(uuidv4));
  expect(gen.next('bbb-id').value).toEqual(call(uuidv4));
  expect(gen.next('ccc-id').value).toEqual(call(uuidv4));
  expect(gen.next('ddd-id').value).toEqual(call(uuidv4));
  expect(gen.next('eee-id').value).toEqual(call(uuidv4));
  expect(gen.next('fff-id').value).toEqual(call(uuidv4));
  expect(gen.next('ggg-id').value).toEqual(call(uuidv4));
  expect(gen.next('hhh-id').value).toEqual(call(uuidv4));
  expect(gen.next('iii-id').value).toEqual(call(uuidv4));
  expect(gen.next('jjj-id').value).toEqual(call(uuidv4));
  expect(gen.next('lll-id').value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "bsy",
      _computationRepo: "easyslider"
    },
    meta: {
      uuid: 'a-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "tns",
      _computationRepo: "ContainerFu"
    },
    meta: {
      uuid: 'b-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "revans",
      _computationRepo: "versioning"
    },
    meta: {
      uuid: 'c-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "sodabrew",
      _computationRepo: "libsieve"
    },
    meta: {
      uuid: 'd-id'
    }
  }));
  expect(gen.next('mediocre-id').value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "turian",
      _computationRepo: "common"
    },
    meta: {
      uuid: 'e-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "canadas",
      _computationRepo: "ufo"
    },
    meta: {
      uuid: 'f-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "ysimonson",
      _computationRepo: "oz"
    },
    meta: {
      uuid: 'g-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "crcx",
      _computationRepo: "colors"
    },
    meta: {
      uuid: 'h-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "kyungyonglee",
      _computationRepo: "ClassAd_Csharp"
    },
    meta: {
      uuid: 'i-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "directeur",
      _computationRepo: "socnode"
    },
    meta: {
      uuid: 'j-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "liquuid",
      _computationRepo: "macsmc"
    },
    meta: {
      uuid: 'k-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "ekfriis",
      _computationRepo: "dotfiles"
    },
    meta: {
      uuid: 'l-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "jeremyd",
      _computationRepo: "rest_connection"
    },
    meta: {
      uuid: 'm-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "pshomov",
      _computationRepo: "greendale"
    },
    meta: {
      uuid: 'n-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "anileech",
      _computationRepo: "AniLeech-Development"
    },
    meta: {
      uuid: 'o-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "nriley",
      _computationRepo: "Make-Flashcards"
    },
    meta: {
      uuid: 'p-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "sorah",
      _computationRepo: "sandbox"
    },
    meta: {
      uuid: 'q-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "objcode",
      _computationRepo: "paisley"
    },
    meta: {
      uuid: 'r-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "nskim",
      _computationRepo: "Find-Max-SMBD"
    },
    meta: {
      uuid: 's-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "Schevo",
      _computationRepo: "xdserver"
    },
    meta: {
      uuid: 't-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "asolove",
      _computationRepo: "learn-scheme"
    },
    meta: {
      uuid: 'u-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "kevinsheffield",
      _computationRepo: "MonoTouchDemos"
    },
    meta: {
      uuid: 'v-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "SnacksOnAPlane",
      _computationRepo: "debately-site"
    },
    meta: {
      uuid: 'w-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "elitheeli",
      _computationRepo: "RubyCAP"
    },
    meta: {
      uuid: 'x-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "azmaveth",
      _computationRepo: "azmaveth"
    },
    meta: {
      uuid: 'y-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "chorny",
      _computationRepo: "AI-MegaHAL"
    },
    meta: {
      uuid: 'z-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "kjg",
      _computationRepo: "derailleur"
    },
    meta: {
      uuid: 'aa-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "chorny",
      _computationRepo: "Hook-LexWrap"
    },
    meta: {
      uuid: 'bb-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "dascgo",
      _computationRepo: "Twitter-Follower-Search"
    },
    meta: {
      uuid: 'cc-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "taouk66",
      _computationRepo: "fourHundred"
    },
    meta: {
      uuid: 'dd-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "jhsu",
      _computationRepo: "DMS315"
    },
    meta: {
      uuid: 'ee-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "juniperoserra",
      _computationRepo: "upfork-particles"
    },
    meta: {
      uuid: 'ff-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "leathekd",
      _computationRepo: "plex_railscasts_plugin"
    },
    meta: {
      uuid: 'gg-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "sunspot82",
      _computationRepo: "605.484"
    },
    meta: {
      uuid: 'hh-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "afairley",
      _computationRepo: "OpenGov-Hack-Day-Melting-Pot"
    },
    meta: {
      uuid: 'ii-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "jri",
      _computationRepo: "deepamehta3-v0.3"
    },
    meta: {
      uuid: 'jj-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "atgreen",
      _computationRepo: "uClibc-moxie"
    },
    meta: {
      uuid: 'kk-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "MikeThacker",
      _computationRepo: "myGSFN"
    },
    meta: {
      uuid: 'll-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "merchantfraud",
      _computationRepo: "merchantfraud.github.com"
    },
    meta: {
      uuid: 'mm-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "dcrec1",
      _computationRepo: "signal"
    },
    meta: {
      uuid: 'nn-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "dekz",
      _computationRepo: "carto"
    },
    meta: {
      uuid: 'oo-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "Chip000",
      _computationRepo: "EQM"
    },
    meta: {
      uuid: 'pp-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "flyerhzm",
      _computationRepo: "rfetion"
    },
    meta: {
      uuid: 'qq-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "wezm",
      _computationRepo: "Gare-du-Nord"
    },
    meta: {
      uuid: 'rr-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "cedric329",
      _computationRepo: "cedric-music"
    },
    meta: {
      uuid: 'ss-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "sumihiro",
      _computationRepo: "iPhoneHTTPProxyServer"
    },
    meta: {
      uuid: 'tt-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "dbuckalew",
      _computationRepo: "gbook"
    },
    meta: {
      uuid: 'uu-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "soudabeh",
      _computationRepo: "project-1"
    },
    meta: {
      uuid: 'vv-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "soudabeh",
      _computationRepo: "1"
    },
    meta: {
      uuid: 'ww-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "1989gaurav",
      _computationRepo: "xdc"
    },
    meta: {
      uuid: 'xx-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "mannd",
      _computationRepo: "morbidmeter"
    },
    meta: {
      uuid: 'yy-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "ralsina",
      _computationRepo: "rst-cheatsheet"
    },
    meta: {
      uuid: 'zz-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "pjfitzgibbons",
      _computationRepo: "FonsecaMartialArts.com"
    },
    meta: {
      uuid: 'aaa-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "kenearley",
      _computationRepo: "Tabbox-Module"
    },
    meta: {
      uuid: 'bbb-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "jamiew",
      _computationRepo: "1click-exploitables"
    },
    meta: {
      uuid: 'ccc-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "lulurun",
      _computationRepo: "fanni"
    },
    meta: {
      uuid: 'ddd-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "azwanmohd",
      _computationRepo: "latex_progress2"
    },
    meta: {
      uuid: 'eee-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "jgm",
      _computationRepo: "rocks"
    },
    meta: {
      uuid: 'fff-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "zacharyp",
      _computationRepo: "Math-Robot"
    },
    meta: {
      uuid: 'ggg-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "woody1983",
      _computationRepo: "Railscoders-for-Rails2.3.3"
    },
    meta: {
      uuid: 'hhh-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "symphonists",
      _computationRepo: "url_segments"
    },
    meta: {
      uuid: 'iii-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "bigbenbt",
      _computationRepo: "math666hw1partb"
    },
    meta: {
      uuid: 'jjj-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPOS",
    payload: {
      _computationSince: 308500,
      _computationReposCount: 62,
    },
    meta: {
      uuid: 'lll-id'
    }
  }));

  expect(gen.next().value).toEqual(put({
    type: GET_REPOS_SUCCESS,
    payload,
    meta: {
      uuid: 'foo'
    }
  }));

  let i = 0;
  const raceObj = {
    'a-id_DONE': take('a-id_DONE'),
    'b-id_DONE': take('b-id_DONE'),
    'c-id_DONE': take('c-id_DONE'),
    'd-id_DONE': take('d-id_DONE'),
    'e-id_DONE': take('e-id_DONE'),
    'f-id_DONE': take('f-id_DONE'),
    'g-id_DONE': take('g-id_DONE'),
    'h-id_DONE': take('h-id_DONE'),
    'i-id_DONE': take('i-id_DONE'),
    'j-id_DONE': take('j-id_DONE'),
    'k-id_DONE': take('k-id_DONE'),
    'l-id_DONE': take('l-id_DONE'),
    'm-id_DONE': take('m-id_DONE'),
    'n-id_DONE': take('n-id_DONE'),
    'o-id_DONE': take('o-id_DONE'),
    'p-id_DONE': take('p-id_DONE'),
    'q-id_DONE': take('q-id_DONE'),
    'r-id_DONE': take('r-id_DONE'),
    's-id_DONE': take('s-id_DONE'),
    't-id_DONE': take('t-id_DONE'),
    'u-id_DONE': take('u-id_DONE'),
    'v-id_DONE': take('v-id_DONE'),
    'w-id_DONE': take('w-id_DONE'),
    'x-id_DONE': take('x-id_DONE'),
    'y-id_DONE': take('y-id_DONE'),
    'z-id_DONE': take('z-id_DONE'),
    'aa-id_DONE': take('aa-id_DONE'),
    'bb-id_DONE': take('bb-id_DONE'),
    'cc-id_DONE': take('cc-id_DONE'),
    'dd-id_DONE': take('dd-id_DONE'),
    'ee-id_DONE': take('ee-id_DONE'),
    'ff-id_DONE': take('ff-id_DONE'),
    'gg-id_DONE': take('gg-id_DONE'),
    'hh-id_DONE': take('hh-id_DONE'),
    'ii-id_DONE': take('ii-id_DONE'),
    'jj-id_DONE': take('jj-id_DONE'),
    'kk-id_DONE': take('kk-id_DONE'),
    'll-id_DONE': take('ll-id_DONE'),
    'mm-id_DONE': take('mm-id_DONE'),
    'nn-id_DONE': take('nn-id_DONE'),
    'oo-id_DONE': take('oo-id_DONE'),
    'pp-id_DONE': take('pp-id_DONE'),
    'qq-id_DONE': take('qq-id_DONE'),
    'rr-id_DONE': take('rr-id_DONE'),
    'ss-id_DONE': take('ss-id_DONE'),
    'tt-id_DONE': take('tt-id_DONE'),
    'uu-id_DONE': take('uu-id_DONE'),
    'vv-id_DONE': take('vv-id_DONE'),
    'ww-id_DONE': take('ww-id_DONE'),
    'xx-id_DONE': take('xx-id_DONE'),
    'yy-id_DONE': take('yy-id_DONE'),
    'zz-id_DONE': take('zz-id_DONE'),
    'aaa-id_DONE': take('aaa-id_DONE'),
    'bbb-id_DONE': take('bbb-id_DONE'),
    'ccc-id_DONE': take('ccc-id_DONE'),
    'ddd-id_DONE': take('ddd-id_DONE'),
    'eee-id_DONE': take('eee-id_DONE'),
    'fff-id_DONE': take('fff-id_DONE'),
    'ggg-id_DONE': take('ggg-id_DONE'),
    'hhh-id_DONE': take('hhh-id_DONE'),
    'iii-id_DONE': take('iii-id_DONE'),
    'jjj-id_DONE': take('jjj-id_DONE'),
    'lll-id_DONE': take('lll-id_DONE'),
    'foo_LOGGED': take('foo_LOGGED'),
  };
  for (; i < Object.keys(raceObj).length; i++) {
    expect(gen.next().value).toEqual(race(raceObj));
  }
  expect(gen.next().value).toEqual(call(doCleanup, 'foo'));
  expect(gen.next().done).toBe(true);
});


test('get repos side effect with no extra repos', () => {
  const payload = {
    _computationSince: 308249,
    _computationReposCount: 100000000 // force stop
  };
  const action = {
    type: GET_REPOS,
    payload,
    meta: {
      uuid: 'foo'
    }
  };
  const gen = getReposSideEffect(action);
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(axios, 'https://api.github.com/repositories?since=308249'));
  expect(gen.next({
    headers: {
      link: '<https://api.github.com/repositories?since=308500>; rel="next", <https://api.github.com/repositories{?since}>; rel="first"'
    },
    data: MOCK_GET_REPOS_DATA.slice(0,10) // 9 useable repos in this
  }).value).toEqual(call(uuidv4));
  expect(gen.next('a-id').value).toEqual(call(uuidv4));
  expect(gen.next('b-id').value).toEqual(call(uuidv4));
  expect(gen.next('c-id').value).toEqual(call(uuidv4));
  expect(gen.next('d-id').value).toEqual(call(uuidv4));
  expect(gen.next('e-id').value).toEqual(call(uuidv4));
  expect(gen.next('f-id').value).toEqual(call(uuidv4));
  expect(gen.next('g-id').value).toEqual(call(uuidv4));
  expect(gen.next('h-id').value).toEqual(call(uuidv4));
  expect(gen.next('i-id').value).toEqual(call(uuidv4));
  expect(gen.next('j-id').value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "bsy",
      _computationRepo: "easyslider"
    },
    meta: {
      uuid: 'a-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "tns",
      _computationRepo: "ContainerFu"
    },
    meta: {
      uuid: 'b-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "revans",
      _computationRepo: "versioning"
    },
    meta: {
      uuid: 'c-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "sodabrew",
      _computationRepo: "libsieve"
    },
    meta: {
      uuid: 'd-id'
    }
  }));
  expect(gen.next('mediocre-id').value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "turian",
      _computationRepo: "common"
    },
    meta: {
      uuid: 'e-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "canadas",
      _computationRepo: "ufo"
    },
    meta: {
      uuid: 'f-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "ysimonson",
      _computationRepo: "oz"
    },
    meta: {
      uuid: 'g-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "crcx",
      _computationRepo: "colors"
    },
    meta: {
      uuid: 'h-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "kyungyonglee",
      _computationRepo: "ClassAd_Csharp"
    },
    meta: {
      uuid: 'i-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: GET_REPOS_SUCCESS,
    payload,
    meta: {
      uuid: 'foo'
    }
  }));

  let i = 0;
  // all called functions plus done
  const raceObj = {
    'a-id_DONE': take('a-id_DONE'),
    'b-id_DONE': take('b-id_DONE'),
    'c-id_DONE': take('c-id_DONE'),
    'd-id_DONE': take('d-id_DONE'),
    'e-id_DONE': take('e-id_DONE'),
    'f-id_DONE': take('f-id_DONE'),
    'g-id_DONE': take('g-id_DONE'),
    'h-id_DONE': take('h-id_DONE'),
    'i-id_DONE': take('i-id_DONE'),
    'foo_LOGGED': take('foo_LOGGED'),
  };
  for (; i < Object.keys(raceObj).length; i++) {
    expect(gen.next().value).toEqual(race(raceObj));
  }
  expect(gen.next().value).toEqual(call(doCleanup, 'foo'));
  expect(gen.next().done).toBe(true);
});


test('get repos side effect with isInitial true', () => {
  const payload = {
    _computationSince: 308249,
    _computationReposCount: 3 // force stop
  };
  const action = {
    type: GET_REPOS,
    payload,
    meta: {
      uuid: 'foo',
      isInitial: true
    }
  };
  const gen = getReposSideEffect(action);
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(axios, 'https://api.github.com/repositories?since=308249'));
  expect(gen.next({
    headers: {
      link: '<https://api.github.com/repositories?since=308500>; rel="next", <https://api.github.com/repositories{?since}>; rel="first"'
    },
    data: MOCK_GET_REPOS_DATA.slice(0,10) // 9 useable repos in this,
  }).value).toEqual(call(uuidv4));
  expect(gen.next('a-id').value).toEqual(call(uuidv4));
  expect(gen.next('b-id').value).toEqual(call(uuidv4));
  expect(gen.next('c-id').value).toEqual(call(uuidv4));
  expect(gen.next('d-id').value).toEqual(call(uuidv4));
  expect(gen.next('e-id').value).toEqual(call(uuidv4));
  expect(gen.next('f-id').value).toEqual(call(uuidv4));
  expect(gen.next('g-id').value).toEqual(call(uuidv4));
  expect(gen.next('h-id').value).toEqual(call(uuidv4));
  expect(gen.next('i-id').value).toEqual(call(uuidv4));
  expect(gen.next('j-id').value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "bsy",
      _computationRepo: "easyslider"
    },
    meta: {
      uuid: 'a-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "tns",
      _computationRepo: "ContainerFu"
    },
    meta: {
      uuid: 'b-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "revans",
      _computationRepo: "versioning"
    },
    meta: {
      uuid: 'c-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "sodabrew",
      _computationRepo: "libsieve"
    },
    meta: {
      uuid: 'd-id'
    }
  }));
  expect(gen.next('mediocre-id').value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "turian",
      _computationRepo: "common"
    },
    meta: {
      uuid: 'e-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "canadas",
      _computationRepo: "ufo"
    },
    meta: {
      uuid: 'f-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "ysimonson",
      _computationRepo: "oz"
    },
    meta: {
      uuid: 'g-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "crcx",
      _computationRepo: "colors"
    },
    meta: {
      uuid: 'h-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "kyungyonglee",
      _computationRepo: "ClassAd_Csharp"
    },
    meta: {
      uuid: 'i-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPOS",
    payload: {
      _computationSince: 308500,
      _computationReposCount: 3 + 9, // 9 useable repos
    },
    meta: {
      uuid: 'j-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: GET_REPOS_SUCCESS,
    payload,
    meta: {
      uuid: 'foo',
      isInitial: true
    }
  }));

  let i = 0;
  // all called functions plus done
  const raceObj = {
    'a-id_DONE': take('a-id_DONE'),
    'b-id_DONE': take('b-id_DONE'),
    'c-id_DONE': take('c-id_DONE'),
    'd-id_DONE': take('d-id_DONE'),
    'e-id_DONE': take('e-id_DONE'),
    'f-id_DONE': take('f-id_DONE'),
    'g-id_DONE': take('g-id_DONE'),
    'h-id_DONE': take('h-id_DONE'),
    'i-id_DONE': take('i-id_DONE'),
    'j-id_DONE': take('j-id_DONE'),
    'foo_LOGGED': take('foo_LOGGED'),
  };
  for (; i < Object.keys(raceObj).length; i++) {
    expect(gen.next().value).toEqual(race(raceObj));
  }
  expect(gen.next().value).toEqual(call(doCleanup, 'foo'));
  expect(gen.next().value).toEqual(put(endScript()));
  expect(gen.next().done).toBe(true);
});


test('get commits side effect face plant', () => {
  const error = new Error('sad');
  const payload = {
    _computationPage: 33,
    _computationId: 36535156,
    _computationOwner: 'reactjs',
    _computationRepo: 'redux'
  };
  const action = {
    type: GET_COMMITS,
    payload,
    meta: {
      uuid: 'foo'
    }
  };
  const gen = getCommitsSideEffect(action);
  gen.next();
  gen.next(state);
  expect(gen.throw(error).value).toEqual(put({
    type: GET_COMMITS_FAILURE,
    payload,
    meta: {
      uuid: 'foo'
    },
    error
  }));
  expect(gen.next().value).toEqual(take('foo_LOGGED'));
  expect(gen.next().value).toEqual(call(doCleanup, 'foo'));
  expect(gen.next().done).toBe(true);
});

test('get commits side effect', () => {
  const payload = {
    _computationPage: 33,
    _computationId: 36535156,
    _computationOwner: 'reactjs',
    _computationRepo: 'redux'
  };
  const action = {
    type: GET_COMMITS,
    payload,
    meta: {
      uuid: 'foo'
    }
  };
  const gen = getCommitsSideEffect(action);
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(axios, 'https://api.github.com/repositories/36535156/commits?page=33'));
  expect(gen.next({
    headers: {
      link: '<https://api.github.com/repositories?since=308500>; rel="next", <https://api.github.com/repositories{?since}>; rel="first"'
    },
    data: MOCK_GET_COMMITS_DATA
  }).value).toEqual(call(uuidv4));
  expect(gen.next('a-id').value).toEqual(call(uuidv4));
  expect(gen.next('b-id').value).toEqual(call(uuidv4));
  expect(gen.next('c-id').value).toEqual(call(uuidv4));
  expect(gen.next('d-id').value).toEqual(call(uuidv4));
  expect(gen.next('e-id').value).toEqual(call(uuidv4));
  expect(gen.next('f-id').value).toEqual(call(uuidv4));
  expect(gen.next('g-id').value).toEqual(call(uuidv4));
  expect(gen.next('h-id').value).toEqual(call(uuidv4));
  expect(gen.next('i-id').value).toEqual(call(uuidv4));
  expect(gen.next('j-id').value).toEqual(call(uuidv4));
  expect(gen.next('k-id').value).toEqual(call(uuidv4));
  expect(gen.next('l-id').value).toEqual(call(uuidv4));
  expect(gen.next('m-id').value).toEqual(call(uuidv4));
  expect(gen.next('n-id').value).toEqual(call(uuidv4));
  expect(gen.next('o-id').value).toEqual(call(uuidv4));
  expect(gen.next('p-id').value).toEqual(call(uuidv4));
  expect(gen.next('q-id').value).toEqual(call(uuidv4));
  expect(gen.next('r-id').value).toEqual(call(uuidv4));
  expect(gen.next('s-id').value).toEqual(call(uuidv4));
  expect(gen.next('t-id').value).toEqual(call(uuidv4));
  expect(gen.next('u-id').value).toEqual(call(uuidv4));
  expect(gen.next('v-id').value).toEqual(call(uuidv4));
  expect(gen.next('w-id').value).toEqual(call(uuidv4));
  expect(gen.next('x-id').value).toEqual(call(uuidv4));
  expect(gen.next('y-id').value).toEqual(call(uuidv4));
  expect(gen.next('z-id').value).toEqual(call(uuidv4));
  expect(gen.next('aa-id').value).toEqual(call(uuidv4));
  expect(gen.next('bb-id').value).toEqual(call(uuidv4));
  expect(gen.next('cc-id').value).toEqual(call(uuidv4));
  expect(gen.next('dd-id').value).toEqual(call(uuidv4));
  expect(gen.next('ee-id').value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "a9ce9a2eb04636f5e595d14d67a67b27eb713f2a",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'a-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "7489e5796b79db5383cf196b05243f4ac5486395",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'b-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "d2969b5e5a1fcc1489feec0a4fcc06f92e1a3e6b",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'c-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "ee5b52e06043591c26c2ec5cf1c345c9adc5a6c1",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'd-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "7ef187a663c83014f6347a65376bcbc971eca294",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'e-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "83353b8e82277bab32cc7a4e098616b35d372a6c",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'f-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "855ac391958015beb1c6bb1f6c5e5550d387b9d3",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'g-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "8ef7d2a6d60d112c2379c124da85796ca3380247",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'h-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "c221a5f03c2713911dff49d85c818393c4b69a7a",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'i-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "7bac7ecb0d15c164035576177d191d2c461d01e6",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'j-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "6de14f4881e5fc6a4a6e0ce86e88a967d46802a3",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'k-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "c30d75fe4a23a3552c4131f0593edcc334eec7d0",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'l-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "b7b456ba5b91b84a41e1bfa59d7d3ef61c3eb5c5",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'm-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "a7b676ec51ece3ac5fd2ec38322f1840080831ad",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'n-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "cfbdc178174b24e27001d358bec61962a6e21097",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'o-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "b35c1c95432e793df92609938ae79be96788e09e",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'p-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "18949fd25060fd89c3edaae431a74770adb2f43b",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'q-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "f6e29040d8164174095b9223b6d46c6962faf22f",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'r-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "ed2617192e57de5ea85d1dde4c5fd8997161445d",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 's-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "c7e8e45d5916b27fe85f60bc0ae59cb4987ec421",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 't-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "6d37efbb8ae805577659e988aa9c09d138e4c6e2",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'u-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "891a97cd3e9a6c8ecea88087bfa3bec878f2ae0a",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'v-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "9686011a3b7efd0007e38285b45bd05456e7bc8d",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'w-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "2c69ff2c2b38bb5a0596fa6eff16bbc2c629ef7e",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'x-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "5e996af1a0d2ee18b6b5a2d61b12e311cf0b6834",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'y-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "b137e1eb7599507c29282bdcf456ac2c47850457",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'z-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "44003e379b67b038a1a071ec588a1be9cc111b18",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'aa-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "ff534e6a2a9ded3a4f39b2857f361ffc7904efb0",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'bb-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "ec0b1a36e958584b7a11a5977734f04d05955c22",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'cc-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "e1b2a95e7e4fd6ce4d5939f15744a715a6e94190",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    },
    meta: {
      uuid: 'dd-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: GET_COMMITS,
    payload: {
      _computationPage: 32,
      _computationCommitCount: 30,
      _computationId: 36535156,
      _computationOwner: 'reactjs',
      _computationRepo: 'redux'
    },
    meta: {
      uuid: 'ee-id'
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: GET_COMMITS_SUCCESS,
    payload,
    meta: {
      uuid: 'foo'
    }
  }));
  let i = 0;
  const raceObj = {
    'a-id_DONE': take('a-id_DONE'),
    'b-id_DONE': take('b-id_DONE'),
    'c-id_DONE': take('c-id_DONE'),
    'd-id_DONE': take('d-id_DONE'),
    'e-id_DONE': take('e-id_DONE'),
    'f-id_DONE': take('f-id_DONE'),
    'g-id_DONE': take('g-id_DONE'),
    'h-id_DONE': take('h-id_DONE'),
    'i-id_DONE': take('i-id_DONE'),
    'j-id_DONE': take('j-id_DONE'),
    'k-id_DONE': take('k-id_DONE'),
    'l-id_DONE': take('l-id_DONE'),
    'm-id_DONE': take('m-id_DONE'),
    'n-id_DONE': take('n-id_DONE'),
    'o-id_DONE': take('o-id_DONE'),
    'p-id_DONE': take('p-id_DONE'),
    'q-id_DONE': take('q-id_DONE'),
    'r-id_DONE': take('r-id_DONE'),
    's-id_DONE': take('s-id_DONE'),
    't-id_DONE': take('t-id_DONE'),
    'u-id_DONE': take('u-id_DONE'),
    'v-id_DONE': take('v-id_DONE'),
    'w-id_DONE': take('w-id_DONE'),
    'x-id_DONE': take('x-id_DONE'),
    'y-id_DONE': take('y-id_DONE'),
    'z-id_DONE': take('z-id_DONE'),
    'aa-id_DONE': take('aa-id_DONE'),
    'bb-id_DONE': take('bb-id_DONE'),
    'cc-id_DONE': take('cc-id_DONE'),
    'dd-id_DONE': take('dd-id_DONE'),
    'ee-id_DONE': take('ee-id_DONE'),
    'foo_LOGGED': take('foo_LOGGED')
  };
  for (; i < Object.keys(raceObj).length; i++) {
    expect(gen.next().value).toEqual(race(raceObj));
  }
  expect(gen.next().value).toEqual(call(doCleanup, 'foo'));
  expect(gen.next().done).toBe(true);
});

test('do cleanup', () => {
  const gen = doCleanup('foobar');
  expect(gen.next().value).toEqual(call(getTasksSideEffect, {}));
  expect(gen.next().value).toEqual(put({
    type: 'foobar_DONE'
  }));
  expect(gen.next().done).toBe(true);
});

test('defer action', () => {
  const action = {
    type: 'foobar',
    payload: {
      type: 'a',
      payload: 'b',
      meta: {
        uuid: 'x'
      }
    }
  }
  const gen = deferActionSideEffect(action);
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(uuidv4));
  expect(gen.next('deferred-uuid').value).toEqual(call(sqlPromise, CONNECTION, INSERT_DEFERRED_STMT, ['x', 'a', JSON.stringify({
    type: 'a',
    payload: 'b',
    meta: {
      uuid: 'x'
    }
  })]));
  expect(gen.next().value).toEqual(put({
    type: DEFER_ACTION_SUCCESS,
    payload: action.payload,
    meta: {
      uuid: 'deferred-uuid'
    }
  }));
  expect(gen.next().value).toEqual(take('deferred-uuid_LOGGED'));
  expect(gen.next().value).toEqual(call(doCleanup, 'x'));
  expect(gen.next().done).toEqual(true);
});

test('get tasks side effect with remaining capacity', () => {
  const gen = getTasksSideEffect({});
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    ...state,
    remaining: 3
  }).value).toEqual(call(uuidv4));
  expect(gen.next('gts').value).toEqual(call(sqlPromise, CONNECTION, SELECT_DEFERRED_STMT, [3]));
  expect(gen.next([
    {
      id: 'x',
      json: '{"type":"GET_COMMITS","payload":{},"meta":{"uuid":"b"}}'
    },
    {
      id: 'y',
      json: '{"type":"GET_REPOS","payload":{},"meta":{"uuid":"d"}}'
    },
    {
      id: 'z',
      json: '{"type":"GET_OTHER_STUFF","payload":{},"meta":{"uuid":"f"}}'
    }
  ]).value).toEqual(call(sqlPromise, CONNECTION, 'DELETE FROM deferred WHERE id = ?;', ['x']));
  expect(gen.next({
    affectedRows: 1
  }).value).toEqual(call(sqlPromise, CONNECTION, 'DELETE FROM deferred WHERE id = ?;', ['y']));
  expect(gen.next({
    affectedRows: 1
  }).value).toEqual(call(sqlPromise, CONNECTION, 'DELETE FROM deferred WHERE id = ?;', ['z']));
  expect(gen.next({
    affectedRows: 1
  }).value).toEqual(put({type:"GET_COMMITS",payload:{},meta:{uuid:"b"}}));
  expect(gen.next().value).toEqual(put({type:"GET_REPOS",payload:{},meta:{uuid:"d"}}));
  expect(gen.next().value).toEqual(put({type:"GET_OTHER_STUFF",payload:{},meta:{uuid:"f"}}));
  expect(gen.next().value).toEqual(put({
    type: GET_TASKS_SUCCESS,
    payload: {
      asked: 3,
      got: 3
    },
    meta: {
      uuid: 'gts'
    }
  }));
  let i = 0;
  for (; i < 4; i++) {
    expect(gen.next().value).toEqual(race({
      'b_DONE': take('b_DONE'),
      'd_DONE': take('d_DONE'),
      'f_DONE': take('f_DONE'),
      'gts_LOGGED': take('gts_LOGGED')
    }));
  }
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    ...state,
    remaining: 0
  }).done).toEqual(true);
});

test('get tasks side with concurrency issues and remaining capacity', () => {
  const gen = getTasksSideEffect({});
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    ...state,
    remaining: 3
  }).value).toEqual(call(uuidv4));
  expect(gen.next('gts').value).toEqual(call(sqlPromise, CONNECTION, SELECT_DEFERRED_STMT, [3]));
  expect(gen.next([
    {
      id: 'x',
      json: '{"type":"GET_COMMITS","payload":{},"meta":{"uuid":"b"}}'
    },
    {
      id: 'y',
      json: '{"type":"GET_REPOS","payload":{},"meta":{"uuid":"d"}}'
    },
    {
      id: 'z',
      json: '{"type":"GET_OTHER_STUFF","payload":{},"meta":{"uuid":"f"}}'
    }
  ]).value).toEqual(call(sqlPromise, CONNECTION, 'DELETE FROM deferred WHERE id = ?;', ['x']));
  expect(gen.next({
    affectedRows: 1
  }).value).toEqual(call(sqlPromise, CONNECTION, 'DELETE FROM deferred WHERE id = ?;', ['y']));
  expect(gen.next({
    affectedRows: 0
  }).value).toEqual(call(sqlPromise, CONNECTION, 'DELETE FROM deferred WHERE id = ?;', ['z']));
  expect(gen.next({
    affectedRows: 1
  }).value).toEqual(put({type:"GET_COMMITS",payload:{},meta:{uuid:"b"}}));
  // skip over event that had no affected rows
  expect(gen.next().value).toEqual(put({type:"GET_OTHER_STUFF",payload:{},meta:{uuid:"f"}}));
  expect(gen.next().value).toEqual(put({
    type: GET_TASKS_SUCCESS,
    payload: {
      asked: 3,
      got: 2
    },
    meta: {
      uuid: 'gts'
    }
  }));
  let i = 0;
  for (; i < 3; i++) {
    expect(gen.next().value).toEqual(race({
      'b_DONE': take('b_DONE'),
      'f_DONE': take('f_DONE'),
      'gts_LOGGED': take('gts_LOGGED')
    }));
  }
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    ...state,
    remaining: 1
  }).value).toEqual(call(uuidv4));  
  // STARTS again
  expect(gen.next('stuff').value).toEqual(call(sqlPromise, CONNECTION, SELECT_DEFERRED_STMT, [1]));
  expect(gen.next([
    {
      id: 'm',
      json: '{"type":"GET_REPOS","payload":{},"meta":{"uuid":"n"}}'
    }
  ]).value).toEqual(call(sqlPromise, CONNECTION, 'DELETE FROM deferred WHERE id = ?;', ['m']));
  expect(gen.next({
    affectedRows: 1
  }).value).toEqual(put({type:"GET_REPOS",payload:{},meta:{uuid:"n"}}));
  expect(gen.next().value).toEqual(put({
    type: GET_TASKS_SUCCESS,
    payload: {
      asked: 1,
      got: 1
    },
    meta: {
      uuid: 'stuff'
    }
  }));
  i = 0;
  for (; i < 2; i++) {
    expect(gen.next().value).toEqual(race({
      'n_DONE': take('n_DONE'),
      'stuff_LOGGED': take('stuff_LOGGED')
    }));
  }
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    ...state,
    remaining: 0
  }).done).toEqual(true);
});

test('get tasks side effect without tasks and isInitial true', () => {
  const gen = getTasksSideEffect({
    meta: {
      isInitial: true
    }
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    ...state,
    remaining: 0
  }).value).toEqual(put(endScript()));
  expect(gen.next().done).toEqual(true);
});

test('get tasks side effect without tasks and isInitial false', () => {
  const gen = getTasksSideEffect({});
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    ...state,
    remaining: 0
  }).done).toEqual(true);
});

test('github saga', () => {
  const gen = githubSaga();
  const fullSaga = [
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next(),
    gen.next()
  ].map(x => x.value);
  const sagaParts = [
    takeEvery(GET_LAST, getLastSideEffect),
    takeEvery(GET_COMMIT, getCommitSideEffect),
    takeEvery(GET_COMMITS, getCommitsSideEffect),
    takeEvery(GET_REPO, getRepoSideEffect),
    takeEvery(GET_REPOS, getReposSideEffect),
    takeEvery(GET_TASKS, getTasksSideEffect),
    takeEvery(DEFER_ACTION, deferActionSideEffect)
  ];
  let i = 0;
  for (; i < sagaParts.length; i++) {
    expect(fullSaga[i]).toEqual(sagaParts[i]);
  }
  expect(fullSaga.length).toBe(sagaParts.length);
  expect(gen.next().done).toBe(true);
});
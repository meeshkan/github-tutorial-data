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
  beginSagaPart,
  endSagaPart,
  stateSelector,
  createFunction,
  exitProcess
} from '../src/github-saga';

import {
  sqlPromise,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
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
  takeEvery
} from 'redux-saga/effects';

import {
  GET_REPO,
  GET_REPOS,
  GET_LAST,
  GET_COMMIT,
  GET_COMMITS,
  GET_TASKS,
  INCREASE_EXECUTION_COUNT,
  DECREASE_EXECUTION_COUNT,
  DECREASE_REMAINING,
  getTasks
} from '../src/actions';

const CONNECTION = 'connection';
const ENV = {
  GITHUB_TUTORIAL_UNIQUE_ID: 'my-unique-id',
  RAVEN_URL: "http://my.raven.url",
  SHOULD_STOP_FUNCTION: 'StopIt',
  PACKAGE_URL: 'http://foo.bar.com/package.zip',
  PACKAGE_NAME: 'package.zip',
  PACKAGE_FOLDER: 'package',
  GITHUB_API: 'https://api.github.com',
  GITHUB_API_LIMIT: '60',
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
  GITHUB_TUTORIAL_SUBNET_ID: 'pfjegngwe',
  GITHUB_TUTORIAL_SECURITY_GROUP_ID: 'lajfefwfk',
  GITHUB_TUTORIAL_IAM_INSTANCE_ARN: 'arn:foo-bar',
  MY_SQL_DATABASE: 'github',
  MY_SQL_SSL: 'some ssl scheme',
  INVOCATION_TYPE: 'Event'
};

const state = {
  connection: CONNECTION,
  env: ENV
}

test('get repo side effect', () => {
  const payload = {
    _computationOwner: 'Meeshkan',
    _computationRepo: 'redux-ize'
  };
  const action = {
    type: GET_REPO,
    payload
  };
  const gen = getRepoSideEffect(action);
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(beginSagaPart, action));
  expect(gen.next(true).value).toEqual(call(axios, 'https://api.github.com/repos/Meeshkan/redux-ize'));
  expect(gen.next({
    data: MOCK_GET_REPO_DATA
  }).value).toEqual(call(sqlPromise, CONNECTION, INSERT_REPO_STMT, [110536681, "Meeshkan", 32298527, "redux-ize", "Meeshkan/redux-ize", "JavaScript", 0, 4, 4, 1, 53, 1, 1, 0, 1, new Date("2017-11-29T15:18:57Z").getTime(), new Date("2017-11-13T10:55:26Z").getTime(), new Date("2017-12-12T13:38:56Z").getTime(), "Meeshkan", 32298527, "redux-ize", "Meeshkan/redux-ize", "JavaScript", 0, 4, 4, 1, 53, 1, 1, 0, 1, new Date("2017-11-29T15:18:57Z").getTime(), new Date("2017-11-13T10:55:26Z").getTime(), new Date("2017-12-12T13:38:56Z").getTime()]));
  expect(gen.next().value).toEqual(put({
    type: GET_LAST,
    payload: {
      _computationId: 110536681,
      _computationOwner: "Meeshkan",
      _computationRepo: "redux-ize",
    }
  }));
  expect(gen.next().value).toEqual(call(endSagaPart));
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
    payload
  };
  const gen = getCommitSideEffect(action);
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(beginSagaPart, action));
  expect(gen.next(true).value).toEqual(call(axios, 'https://api.github.com/repos/Meeshkan/redux-ize/commits/84d1bbf0643eacaf94685155cd53ae170b561e1b'));
  expect(gen.next({
    data: MOCK_GET_COMMIT_DATA
  }).value).toEqual(call(sqlPromise, CONNECTION, INSERT_COMMIT_STMT, ["84d1bbf0643eacaf94685155cd53ae170b561e1b", 110536681, "Mike Solomon", "mike@mikesolomon.org", new Date("2017-11-13T11:51:59Z").getTime(), "Mike Solomon", "mike@mikesolomon.org", new Date("2017-11-13T11:51:59Z").getTime(), "mikesol", 525350, "mikesol", 525350, 5455, 0, 5455, 24, 0, 24, 110536681, "Mike Solomon", "mike@mikesolomon.org", new Date("2017-11-13T11:51:59Z").getTime(), "Mike Solomon", "mike@mikesolomon.org", new Date("2017-11-13T11:51:59Z").getTime(), "mikesol", 525350, "mikesol", 525350, 5455, 0, 5455, 24, 0, 24]));
  expect(gen.next().value).toEqual(call(endSagaPart));
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
    payload
  };
  const gen = getLastSideEffect(action);
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(beginSagaPart, action));
  expect(gen.next(true).value).toEqual(call(axios, 'https://api.github.com/repos/redux-saga/redux-saga/commits'));
  expect(gen.next({
    headers: {
      Link: '<https://api.github.com/repositories/47071941/commits?page=2>; rel="next", <https://api.github.com/repositories/47071941/commits?page=47>; rel="last"'
    }
  }).value).toEqual(put({
    type: GET_COMMITS,
    payload: {
      _computationId: 110536681,
      _computationOwner: "redux-saga",
      _computationRepo: "redux-saga",
      _computationCommitCount: 0,
      _computationPage: 47
    }
  }));
  expect(gen.next().value).toEqual(call(endSagaPart));
  expect(gen.next().done).toBe(true);
});

test('get repos side effect', () => {
  const payload = {
    _computationSince: 308249
  };
  const action = {
    type: GET_REPOS,
    payload
  };
  const gen = getReposSideEffect(action);
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(beginSagaPart, action));
  expect(gen.next(true).value).toEqual(call(axios, 'https://api.github.com/repositories?since=308249'));
  expect(gen.next({
    headers: {
      Link: '<https://api.github.com/repositories?since=308500>; rel="next", <https://api.github.com/repositories{?since}>; rel="first"'
    },
    data: MOCK_GET_REPOS_DATA
  }).value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "bsy",
      _computationRepo: "easyslider"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "tns",
      _computationRepo: "ContainerFu"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "revans",
      _computationRepo: "versioning"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "sodabrew",
      _computationRepo: "libsieve"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "turian",
      _computationRepo: "common"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "canadas",
      _computationRepo: "ufo"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "ysimonson",
      _computationRepo: "oz"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "crcx",
      _computationRepo: "colors"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "kyungyonglee",
      _computationRepo: "ClassAd_Csharp"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "directeur",
      _computationRepo: "socnode"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "liquuid",
      _computationRepo: "macsmc"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "ekfriis",
      _computationRepo: "dotfiles"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "jeremyd",
      _computationRepo: "rest_connection"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "pshomov",
      _computationRepo: "greendale"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "anileech",
      _computationRepo: "AniLeech-Development"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "nriley",
      _computationRepo: "Make-Flashcards"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "sorah",
      _computationRepo: "sandbox"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "objcode",
      _computationRepo: "paisley"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "nskim",
      _computationRepo: "Find-Max-SMBD"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "Schevo",
      _computationRepo: "xdserver"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "asolove",
      _computationRepo: "learn-scheme"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "kevinsheffield",
      _computationRepo: "MonoTouchDemos"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "SnacksOnAPlane",
      _computationRepo: "debately-site"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "elitheeli",
      _computationRepo: "RubyCAP"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "azmaveth",
      _computationRepo: "azmaveth"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "chorny",
      _computationRepo: "AI-MegaHAL"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "kjg",
      _computationRepo: "derailleur"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "chorny",
      _computationRepo: "Hook-LexWrap"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "dascgo",
      _computationRepo: "Twitter-Follower-Search"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "taouk66",
      _computationRepo: "fourHundred"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "jhsu",
      _computationRepo: "DMS315"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "juniperoserra",
      _computationRepo: "upfork-particles"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "leathekd",
      _computationRepo: "plex_railscasts_plugin"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "sunspot82",
      _computationRepo: "605.484"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "afairley",
      _computationRepo: "OpenGov-Hack-Day-Melting-Pot"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "jri",
      _computationRepo: "deepamehta3-v0.3"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "atgreen",
      _computationRepo: "uClibc-moxie"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "MikeThacker",
      _computationRepo: "myGSFN"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "merchantfraud",
      _computationRepo: "merchantfraud.github.com"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "dcrec1",
      _computationRepo: "signal"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "dekz",
      _computationRepo: "carto"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "Chip000",
      _computationRepo: "EQM"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "flyerhzm",
      _computationRepo: "rfetion"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "wezm",
      _computationRepo: "Gare-du-Nord"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "cedric329",
      _computationRepo: "cedric-music"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "sumihiro",
      _computationRepo: "iPhoneHTTPProxyServer"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "dbuckalew",
      _computationRepo: "gbook"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "soudabeh",
      _computationRepo: "project-1"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "soudabeh",
      _computationRepo: "1"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "1989gaurav",
      _computationRepo: "xdc"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "mannd",
      _computationRepo: "morbidmeter"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "ralsina",
      _computationRepo: "rst-cheatsheet"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "pjfitzgibbons",
      _computationRepo: "FonsecaMartialArts.com"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "kenearley",
      _computationRepo: "Tabbox-Module"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "jamiew",
      _computationRepo: "1click-exploitables"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "lulurun",
      _computationRepo: "fanni"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "azwanmohd",
      _computationRepo: "latex_progress2"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "jgm",
      _computationRepo: "rocks"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "zacharyp",
      _computationRepo: "Math-Robot"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "woody1983",
      _computationRepo: "Railscoders-for-Rails2.3.3"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "symphonists",
      _computationRepo: "url_segments"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPO",
    payload: {
      _computationOwner: "bigbenbt",
      _computationRepo: "math666hw1partb"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_REPOS",
    payload: {
      _computationSince: 308500,
      _computationReposCount: 62,
    }
  }));
  expect(gen.next().value).toEqual(call(endSagaPart));
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
    payload
  };
  const gen = getCommitsSideEffect(action);
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(beginSagaPart, action));
  expect(gen.next(true).value).toEqual(call(axios, 'https://api.github.com/repositories/36535156/commits?page=33'));
  expect(gen.next({
    headers: {
      Link: '<https://api.github.com/repositories?since=308500>; rel="next", <https://api.github.com/repositories{?since}>; rel="first"'
    },
    data: MOCK_GET_COMMITS_DATA
  }).value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "a9ce9a2eb04636f5e595d14d67a67b27eb713f2a",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "7489e5796b79db5383cf196b05243f4ac5486395",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "d2969b5e5a1fcc1489feec0a4fcc06f92e1a3e6b",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "ee5b52e06043591c26c2ec5cf1c345c9adc5a6c1",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "7ef187a663c83014f6347a65376bcbc971eca294",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "83353b8e82277bab32cc7a4e098616b35d372a6c",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "855ac391958015beb1c6bb1f6c5e5550d387b9d3",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "8ef7d2a6d60d112c2379c124da85796ca3380247",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "c221a5f03c2713911dff49d85c818393c4b69a7a",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "7bac7ecb0d15c164035576177d191d2c461d01e6",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "6de14f4881e5fc6a4a6e0ce86e88a967d46802a3",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "c30d75fe4a23a3552c4131f0593edcc334eec7d0",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "b7b456ba5b91b84a41e1bfa59d7d3ef61c3eb5c5",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "a7b676ec51ece3ac5fd2ec38322f1840080831ad",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "cfbdc178174b24e27001d358bec61962a6e21097",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "b35c1c95432e793df92609938ae79be96788e09e",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "18949fd25060fd89c3edaae431a74770adb2f43b",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "f6e29040d8164174095b9223b6d46c6962faf22f",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "ed2617192e57de5ea85d1dde4c5fd8997161445d",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "c7e8e45d5916b27fe85f60bc0ae59cb4987ec421",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "6d37efbb8ae805577659e988aa9c09d138e4c6e2",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "891a97cd3e9a6c8ecea88087bfa3bec878f2ae0a",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "9686011a3b7efd0007e38285b45bd05456e7bc8d",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "2c69ff2c2b38bb5a0596fa6eff16bbc2c629ef7e",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "5e996af1a0d2ee18b6b5a2d61b12e311cf0b6834",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "b137e1eb7599507c29282bdcf456ac2c47850457",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "44003e379b67b038a1a071ec588a1be9cc111b18",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "ff534e6a2a9ded3a4f39b2857f361ffc7904efb0",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "ec0b1a36e958584b7a11a5977734f04d05955c22",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
    }
  }));
  expect(gen.next().value).toEqual(put({
    type: "GET_COMMIT",
    payload: {
      _computationId: 36535156,
      _computationSHA: "e1b2a95e7e4fd6ce4d5939f15744a715a6e94190",
      _computationOwner: "reactjs",
      _computationRepo: "redux"
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
    }
  }));
  expect(gen.next().value).toEqual(call(endSagaPart));
  expect(gen.next().done).toBe(true);
});

test('end saga when there is remaining capacity', () => {
  const gen = endSagaPart();
  expect(gen.next().value).toEqual(put({
    type: DECREASE_EXECUTION_COUNT
  }))
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    remaining: 10
  }).value).toEqual(put(getTasks(10)));
  expect(gen.next().done).toBe(true);
});

test('end saga when there is no remaining capacity but other units are executing', () => {
  const gen = endSagaPart();
  expect(gen.next().value).toEqual(put({
    type: DECREASE_EXECUTION_COUNT
  }))
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    remaining: 0,
    executing: 1
  }).done).toBe(true);
});

test('end saga when there is no remaining capacity, other units are not executing locally, other units are executing on other servers and we have too few tasks to spawn something new', () => {
  const gen = endSagaPart();
  expect(gen.next().value).toEqual(put({
    type: DECREASE_EXECUTION_COUNT
  }))
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    connection: CONNECTION,
    env: ENV,
    remaining: -5,
    executing: 0
  }).value).toEqual(call(beginTransaction, CONNECTION));
  expect(gen.next().value).toEqual(call(sqlPromise, CONNECTION, SELECT_UNFULFILLED_STMT, ['unfulfilled']));
  expect(gen.next([{
    unfulfilled: 30
  }]).value).toEqual(call(sqlPromise, CONNECTION, SELECT_EXECUTING_STATEMENT, []));
  expect(gen.next([{
    executing: 17
  }]).value).toEqual(call(sqlPromise, CONNECTION, DECREASE_EXECUTING_STATEMENT, ['my-unique-id']));
  // unfulfilled should be previous plus remaining as we are not over 60
  expect(gen.next().value).toEqual(call(sqlPromise, CONNECTION, CHANGE_UNFULFILLED_STATEMENT, ['unfulfilled', 35, 35]));
  expect(gen.next().value).toEqual(call(commitTransaction, CONNECTION));
  expect(gen.next().value).toEqual(call(destroy, CONNECTION));
  expect(gen.next().value).toEqual(call(exitProcess));
});

test('end saga when there is no remaining capacity, other units are not executing locally, other units are executing on other servers and we have enough tasks to spawn something new', () => {
  const gen = endSagaPart();
  expect(gen.next().value).toEqual(put({
    type: DECREASE_EXECUTION_COUNT
  }))
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    connection: CONNECTION,
    env: ENV,
    remaining: -8,
    executing: 0
  }).value).toEqual(call(beginTransaction, CONNECTION));
  expect(gen.next().value).toEqual(call(sqlPromise, CONNECTION, SELECT_UNFULFILLED_STMT, ['unfulfilled']));
  expect(gen.next([{
    unfulfilled: 143
  }]).value).toEqual(call(sqlPromise, CONNECTION, SELECT_EXECUTING_STATEMENT, []));
  expect(gen.next([{
    executing: 17
  }]).value).toEqual(call(sqlPromise, CONNECTION, DECREASE_EXECUTING_STATEMENT, ['my-unique-id']));
  // we should spawn two tasks and have 143 old + 8 new - 120 for the two new tasks
  expect(gen.next().value).toEqual(call(sqlPromise, CONNECTION, CHANGE_UNFULFILLED_STATEMENT, ['unfulfilled', 31, 31]));
  expect(gen.next().value).toEqual(call(commitTransaction, CONNECTION));
  expect(gen.next().value).toEqual(call(destroy, CONNECTION));
  const USER_DATA = id => `#!/bin/bash
export GITHUB_TUTORIAL_UNIQUE_ID="${id}" && \
export RAVEN_URL="http://my.raven.url" && \
export MY_SQL_HOST="my.sql.cluster" && \
export MY_SQL_PORT="3306" && \
export MY_SQL_USERNAME="meeshkan" && \
export MY_SQL_PASSWORD="octocatrules" && \
export MY_SQL_DATABASE="github" && \
export MY_SQL_SSL="some ssl scheme" && \
export GITHUB_API="https://api.github.com" && \
export START_REPO="1234567" && \
export MAX_REPOS="60001" && \
export MAX_COMMITS="59" && \
export SHOULD_STOP_FUNCTION="StopIt" && \
export MAX_COMPUTATIONS="949" && \
export PACKAGE_URL="http://foo.bar.com/package.zip" && \
export PACKAGE_NAME="package.zip" && \
export PACKAGE_FOLDER="package" && \
export GITHUB_API_LIMIT="60" && \
export GITHUB_TUTORIAL_DRY_RUN="true" && \
export GITHUB_TUTORIAL_SUBNET_ID="pfjegngwe" && \
export GITHUB_TUTORIAL_SECURITY_GROUP_ID="lajfefwfk" && \
export GITHUB_TUTORIAL_IAM_INSTANCE_ARN="arn:foo-bar" && \
export GITHUB_TUTORIAL_IMAGE_ID="ami-3511515" && \
mkdir $PACKAGE_FOLDER && \
cd $PACKAGE_FOLDER && \
wget $PACKAGE_URL && \
unzip $PACKAGE_NAME && \
node index.js
shutdown -h now
`;
  const params = id => ({
    InstanceCount: 1,
    DryRun: true,
    InstanceInitiatedShutdownBehavior: 'terminate',
    LaunchSpecification: {
      InstanceType: 't2.micro',
      SubnetId: 'pfjegngwe',
      SecurityGroupIds: [
        'lajfefwfk'
      ],
      IamInstanceProfile: {
        Arn: 'arn:foo-bar'
      },
      Monitoring: {
        Enabled: false
      },
      ImageId: 'ami-3511515',
      UserData: new Buffer(USER_DATA(id)).toString('base64')
    },
    SpotPrice: "0.0043",
    Type: "one-time"
  });
  expect(gen.next().value).toEqual(call(uuidv4));
  expect(gen.next('another-unique-id').value).toEqual(call(createFunction, params('another-unique-id')));
  expect(gen.next().value).toEqual(call(sqlPromise, CONNECTION, INCREASE_EXECUTING_STATEMENT, ['another-unique-id']));
  expect(gen.next().value).toEqual(call(uuidv4));
  expect(gen.next('yet-another-unique-id').value).toEqual(call(createFunction, params('yet-another-unique-id')));
  expect(gen.next().value).toEqual(call(sqlPromise, CONNECTION, INCREASE_EXECUTING_STATEMENT, ['yet-another-unique-id']));
  expect(gen.next().value).toEqual(call(exitProcess));
});

test('begin saga part with capacity', () => {
  const gen = beginSagaPart({});
  expect(gen.next().value).toEqual(put({
    type: INCREASE_EXECUTION_COUNT
  }));
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    remaining: 10
  }).value).toEqual(put({
    type: DECREASE_REMAINING
  }));
  const {
    value,
    done
  } = gen.next();
  expect(value).toEqual(true);
  expect(done).toEqual(true);
});

test('begin saga part without capacity', () => {
  const gen = beginSagaPart({
    type: 'foo',
    payload: 'bar'
  });
  expect(gen.next().value).toEqual(put({
    type: INCREASE_EXECUTION_COUNT
  }));
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next({
    ...state,
    remaining: 0
  }).value).toEqual(put({
    type: DECREASE_REMAINING
  }));
  expect(gen.next().value).toEqual(call(uuidv4));
  expect(gen.next('my-uuid').value).toEqual(call(sqlPromise, CONNECTION, INSERT_DEFERRED_STMT, ['my-uuid', 'foo', JSON.stringify({
    type: 'foo',
    payload: 'bar'
  })]));
  const {
    value,
    done
  } = gen.next();
  expect(value).toEqual(false);
  expect(done).toEqual(true);
});

test('get tasks side effect', () => {
  const gen = getTasksSideEffect({
    payload: 3
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(beginTransaction, CONNECTION));
  expect(gen.next().value).toEqual(call(sqlPromise, CONNECTION, SELECT_DEFERRED_STMT, ['GET_COMMIT', 'GET_COMMITS', 'GET_LAST', 'GET_REPO', 'GET_REPOS', 3]));
  ///DELETE FROM deferred WHERE
  expect(gen.next([{
      id: 'x',
      json: '{"a":"b"}'
    },
    {
      id: 'y',
      json: '{"c":"d"}'
    },
    {
      id: 'z',
      json: '{"e":"f"}'
    },
  ]).value).toEqual(call(sqlPromise, CONNECTION, 'DELETE FROM deferred WHERE id = ? OR id = ? OR id = ?;', ['x', 'y', 'z']));
  expect(gen.next().value).toEqual(put({
    "a": "b"
  }));
  expect(gen.next().value).toEqual(put({
    "c": "d"
  }));
  expect(gen.next().value).toEqual(put({
    "e": "f"
  }));
  expect(gen.next().done).toEqual(true);
});

test('github saga', () => {
  const gen = githubSaga();
  const fullSaga = [
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
    takeEvery(GET_TASKS, getTasksSideEffect)
  ];
  let i = 0;
  for (; i < sagaParts.length; i++) {
    expect(fullSaga[i]).toEqual(sagaParts[i]);
  }
  expect(fullSaga.length).toBe(sagaParts.length);
  expect(gen.next().done).toBe(true);
});
import axios from 'axios';
import uuidv4 from 'uuid/v4';

import {
  MOCK_GET_REPO_DATA,
  MOCK_GET_COMMIT_DATA,
  MOCK_GET_REPOS_DATA,
  MOCK_GET_COMMITS_DATA
} from './mock-data';

import {
  stateSelector,
  getRepoSideEffect,
  getCommitSideEffect,
  getLastSideEffect,
  getCommitsSideEffect,
  getReposSideEffect,
  newComputationSideEffect,
  createFunction,
  invokeFunction,
  endComputationSideEffect,
  destroy,
  deleteLambda,
  functionNameFromPayload
} from '../src/github-saga';

import {
  sqlPromise,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
} from '../src/util';

import {
  INSERT_REPO_STMT,
  INSERT_COMMIT_STMT,
  SELECT_CONNECTIONS_STMT,
  INSERT_DEFERRED_STMT,
  DECREASE_CONNECTION_COUNT_STATEMENT,
  SELECT_DEFFERED_STMT
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
  END_COMPUTATION,
  endComputation,
} from '../src/actions';

const CONNECTION = 'connection';
const ENV = {
  GITHUB_API: 'https://api.github.com',
  MAX_COMMITS: '100',
  MAX_REPOS: '6000',
  MAX_LAMBDAS: '200',
  LAMBDA_FUNCTION_S3_BUCKET: 'foo',
  LAMBDA_FUNCTION_S3_KEY: 'bar',
  LAMBDA_ROLE: 'arn:this-is-a-role',
  LAMBDA_SECURITY_GROUP: 'my-security-group',
  LAMBDA_SUBNET_1: 'my-subnet-1',
  LAMBDA_SUBNET_2: 'my-subnet-2',
  LAMBDA_SUBNET_3: 'my-subnet-3',
  MY_SQL_PORT: '3306',
  MY_SQL_HOST: 'my.sql.cluster',
  MY_SQL_USERNAME: 'meeshkan',
  MY_SQL_PASSWORD: 'octocatrules',
  MY_SQL_DATABASE: 'github',
  MY_SQL_SSL: 'some ssl scheme',
  SHOULD_STOP_FUNCTION: 'ShouldStop',
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
  const gen = getRepoSideEffect({
    type: GET_REPO,
    payload
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(axios, 'https://api.github.com/repos/Meeshkan/redux-ize'));
  expect(gen.next({
    data: MOCK_GET_REPO_DATA
  }).value).toEqual(call(sqlPromise, CONNECTION, INSERT_REPO_STMT, [110536681, "Meeshkan", 32298527, "redux-ize", "Meeshkan/redux-ize", "JavaScript", 0, 4, 4, 1, 53, 1, 1, 0, 1, "2017-11-29T15:18:57Z", "2017-11-13T10:55:26Z", "2017-12-12T13:38:56Z", "Meeshkan", 32298527, "redux-ize", "Meeshkan/redux-ize", "JavaScript", 0, 4, 4, 1, 53, 1, 1, 0, 1, "2017-11-29T15:18:57Z", "2017-11-13T10:55:26Z", "2017-12-12T13:38:56Z"]));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationId: 110536681,
    _computationOwner: "Meeshkan",
    _computationRepo: "redux-ize",
    _computationAction: GET_LAST
  }));
  expect(gen.next().value).toEqual(put(endComputation(payload)));
  expect(gen.next().done).toBe(true);
});

test('get commit side effect', () => {
  const payload = {
    _computationId: 110536681,
    _computationSHA: "84d1bbf0643eacaf94685155cd53ae170b561e1b",
    _computationOwner: 'Meeshkan',
    _computationRepo: 'redux-ize'
  };
  const gen = getCommitSideEffect({
    type: GET_COMMIT,
    payload
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(axios, 'https://api.github.com/repos/Meeshkan/redux-ize/commits/84d1bbf0643eacaf94685155cd53ae170b561e1b'));
  expect(gen.next({
    data: MOCK_GET_COMMIT_DATA
  }).value).toEqual(call(sqlPromise, CONNECTION, INSERT_COMMIT_STMT, ["84d1bbf0643eacaf94685155cd53ae170b561e1b", 110536681, "Mike Solomon", "mike@mikesolomon.org", "2017-11-13T11:51:59Z", "Mike Solomon", "mike@mikesolomon.org", "2017-11-13T11:51:59Z", "mikesol", 525350, "mikesol", 525350, 5455, 0, 5455, 24, 0, 24, 110536681, "Mike Solomon", "mike@mikesolomon.org", "2017-11-13T11:51:59Z", "Mike Solomon", "mike@mikesolomon.org", "2017-11-13T11:51:59Z", "mikesol", 525350, "mikesol", 525350, 5455, 0, 5455, 24, 0, 24]));
  expect(gen.next().value).toEqual(put(endComputation(payload)));
  expect(gen.next().done).toBe(true);
});

test('get last side effect', () => {
  const payload = {
    _computationId: 110536681,
    _computationOwner: 'redux-saga',
    _computationRepo: 'redux-saga'
  };
  const gen = getLastSideEffect({
    type: GET_LAST,
    payload
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(axios, 'https://api.github.com/repos/redux-saga/redux-saga/commits'));
  expect(gen.next({
    headers: {
      Link: '<https://api.github.com/repositories/47071941/commits?page=2>; rel="next", <https://api.github.com/repositories/47071941/commits?page=47>; rel="last"'
    }
  }).value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationId: 110536681,
    _computationOwner: "redux-saga",
    _computationRepo: "redux-saga",
    _computationAction: GET_COMMITS,
    _computationCommitCount: 0,
    _computationPage: 47
  }));
  expect(gen.next().value).toEqual(put(endComputation(payload)));
  expect(gen.next().done).toBe(true);
});

test('get repos side effect', () => {
  const payload = {
    _computationSince: 308249
  };
  const gen = getReposSideEffect({
    type: GET_REPOS,
    payload
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(axios, 'https://api.github.com/repositories?since=308249'));
  expect(gen.next({
    headers: {
      Link: '<https://api.github.com/repositories?since=308500>; rel="next", <https://api.github.com/repositories{?since}>; rel="first"'
    },
    data: MOCK_GET_REPOS_DATA
  }).value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "bsy",
    _computationRepo: "easyslider"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "tns",
    _computationRepo: "ContainerFu"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "revans",
    _computationRepo: "versioning"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "sodabrew",
    _computationRepo: "libsieve"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "turian",
    _computationRepo: "common"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "canadas",
    _computationRepo: "ufo"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "ysimonson",
    _computationRepo: "oz"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "crcx",
    _computationRepo: "colors"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "kyungyonglee",
    _computationRepo: "ClassAd_Csharp"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "directeur",
    _computationRepo: "socnode"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "liquuid",
    _computationRepo: "macsmc"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "ekfriis",
    _computationRepo: "dotfiles"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "jeremyd",
    _computationRepo: "rest_connection"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "pshomov",
    _computationRepo: "greendale"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "anileech",
    _computationRepo: "AniLeech-Development"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "nriley",
    _computationRepo: "Make-Flashcards"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "sorah",
    _computationRepo: "sandbox"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "objcode",
    _computationRepo: "paisley"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "nskim",
    _computationRepo: "Find-Max-SMBD"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "Schevo",
    _computationRepo: "xdserver"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "asolove",
    _computationRepo: "learn-scheme"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "kevinsheffield",
    _computationRepo: "MonoTouchDemos"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "SnacksOnAPlane",
    _computationRepo: "debately-site"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "elitheeli",
    _computationRepo: "RubyCAP"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "azmaveth",
    _computationRepo: "azmaveth"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "chorny",
    _computationRepo: "AI-MegaHAL"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "kjg",
    _computationRepo: "derailleur"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "chorny",
    _computationRepo: "Hook-LexWrap"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "dascgo",
    _computationRepo: "Twitter-Follower-Search"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "taouk66",
    _computationRepo: "fourHundred"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "jhsu",
    _computationRepo: "DMS315"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "juniperoserra",
    _computationRepo: "upfork-particles"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "leathekd",
    _computationRepo: "plex_railscasts_plugin"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "sunspot82",
    _computationRepo: "605.484"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "afairley",
    _computationRepo: "OpenGov-Hack-Day-Melting-Pot"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "jri",
    _computationRepo: "deepamehta3-v0.3"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "atgreen",
    _computationRepo: "uClibc-moxie"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "MikeThacker",
    _computationRepo: "myGSFN"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "merchantfraud",
    _computationRepo: "merchantfraud.github.com"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "dcrec1",
    _computationRepo: "signal"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "dekz",
    _computationRepo: "carto"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "Chip000",
    _computationRepo: "EQM"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "flyerhzm",
    _computationRepo: "rfetion"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "wezm",
    _computationRepo: "Gare-du-Nord"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "cedric329",
    _computationRepo: "cedric-music"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "sumihiro",
    _computationRepo: "iPhoneHTTPProxyServer"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "dbuckalew",
    _computationRepo: "gbook"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "soudabeh",
    _computationRepo: "project-1"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "soudabeh",
    _computationRepo: "1"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "1989gaurav",
    _computationRepo: "xdc"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "mannd",
    _computationRepo: "morbidmeter"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "ralsina",
    _computationRepo: "rst-cheatsheet"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "pjfitzgibbons",
    _computationRepo: "FonsecaMartialArts.com"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "kenearley",
    _computationRepo: "Tabbox-Module"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "jamiew",
    _computationRepo: "1click-exploitables"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "lulurun",
    _computationRepo: "fanni"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "azwanmohd",
    _computationRepo: "latex_progress2"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "jgm",
    _computationRepo: "rocks"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "zacharyp",
    _computationRepo: "Math-Robot"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "woody1983",
    _computationRepo: "Railscoders-for-Rails2.3.3"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "symphonists",
    _computationRepo: "url_segments"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPO",
    _computationOwner: "bigbenbt",
    _computationRepo: "math666hw1partb"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_REPOS",
    _computationSince: 308500,
    _computationReposCount: 62,
  }));
  expect(gen.next().value).toEqual(put(endComputation(payload)));
  expect(gen.next().done).toBe(true);
});

test('get commits side effect', () => {
  const payload = {
    _computationPage: 33,
    _computationId: 36535156,
    _computationOwner: 'reactjs',
    _computationRepo: 'redux'
  };
  const gen = getCommitsSideEffect({
    type: GET_COMMITS,
    payload
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(axios, 'https://api.github.com/repositories/36535156/commits?page=33'));
  expect(gen.next({
    headers: {
      Link: '<https://api.github.com/repositories?since=308500>; rel="next", <https://api.github.com/repositories{?since}>; rel="first"'
    },
    data: MOCK_GET_COMMITS_DATA
  }).value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "a9ce9a2eb04636f5e595d14d67a67b27eb713f2a",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "7489e5796b79db5383cf196b05243f4ac5486395",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "d2969b5e5a1fcc1489feec0a4fcc06f92e1a3e6b",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "ee5b52e06043591c26c2ec5cf1c345c9adc5a6c1",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "7ef187a663c83014f6347a65376bcbc971eca294",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "83353b8e82277bab32cc7a4e098616b35d372a6c",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "855ac391958015beb1c6bb1f6c5e5550d387b9d3",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "8ef7d2a6d60d112c2379c124da85796ca3380247",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "c221a5f03c2713911dff49d85c818393c4b69a7a",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "7bac7ecb0d15c164035576177d191d2c461d01e6",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "6de14f4881e5fc6a4a6e0ce86e88a967d46802a3",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "c30d75fe4a23a3552c4131f0593edcc334eec7d0",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "b7b456ba5b91b84a41e1bfa59d7d3ef61c3eb5c5",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "a7b676ec51ece3ac5fd2ec38322f1840080831ad",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "cfbdc178174b24e27001d358bec61962a6e21097",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "b35c1c95432e793df92609938ae79be96788e09e",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "18949fd25060fd89c3edaae431a74770adb2f43b",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "f6e29040d8164174095b9223b6d46c6962faf22f",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "ed2617192e57de5ea85d1dde4c5fd8997161445d",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "c7e8e45d5916b27fe85f60bc0ae59cb4987ec421",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "6d37efbb8ae805577659e988aa9c09d138e4c6e2",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "891a97cd3e9a6c8ecea88087bfa3bec878f2ae0a",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "9686011a3b7efd0007e38285b45bd05456e7bc8d",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "2c69ff2c2b38bb5a0596fa6eff16bbc2c629ef7e",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "5e996af1a0d2ee18b6b5a2d61b12e311cf0b6834",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "b137e1eb7599507c29282bdcf456ac2c47850457",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "44003e379b67b038a1a071ec588a1be9cc111b18",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "ff534e6a2a9ded3a4f39b2857f361ffc7904efb0",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "ec0b1a36e958584b7a11a5977734f04d05955c22",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: "GET_COMMIT",
    _computationId: 36535156,
    _computationSHA: "e1b2a95e7e4fd6ce4d5939f15744a715a6e94190",
    _computationOwner: "reactjs",
    _computationRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {
    _computationAction: GET_COMMITS,
    _computationPage: 32,
    _computationCommitCount: 30,
    _computationId: 36535156,
    _computationOwner: 'reactjs',
    _computationRepo: 'redux'
  }))
  expect(gen.next().value).toEqual(put(endComputation(payload)));
  expect(gen.next().done).toBe(true);
});

test('computation side effect happy path', () => {
  const gen = newComputationSideEffect(CONNECTION, ENV, {
    _computationAction: "GET_REPOS",
    _computationSince: 100
  });
  expect(gen.next().value).toEqual(call(sqlPromise, CONNECTION, SELECT_CONNECTIONS_STMT, ['connections']));
  expect(gen.next([{
    connections: 10
  }]).value).toEqual(call(createFunction, {
    Code: {
      S3Bucket: 'foo',
      S3Key: 'bar'
    },
    FunctionName: 'GithubTutorial_GET_REPOS_100',
    Handler: 'index.handler',
    Role: 'arn:this-is-a-role',
    Runtime: 'nodejs4.3',
    Environment: {
      Variables: ENV
    },
    MemorySize: 128,
    Publish: true,
    Timeout: 15,
    VpcConfig: {
      SecurityGroupIds: [
        'my-security-group'
      ],
      SubnetIds: [
        'my-subnet-1',
        'my-subnet-2',
        'my-subnet-3'
      ]
    }
  }));
  expect(gen.next().value).toEqual(call(invokeFunction, {
    InvocationType: 'Event',
    FunctionName: 'GithubTutorial_GET_REPOS_100',
    Payload: JSON.stringify({
      _computationAction: "GET_REPOS",
      _computationSince: 100,
      _computationFunctionName: 'GithubTutorial_GET_REPOS_100'
    })
  }));
  expect(gen.next().done).toBe(true);
});

test('computation side effect too many connections', () => {
  const payload = {
    _computationAction: "GET_REPOS",
    _computationSince: 100
  };
  const gen = newComputationSideEffect(CONNECTION, ENV, payload);
  expect(gen.next().value).toEqual(call(sqlPromise, CONNECTION, SELECT_CONNECTIONS_STMT, ['connections']));
  expect(gen.next([{
    connections: 201
  }]).value).toEqual(call(uuidv4));
  expect(gen.next('foo').value).toEqual(call(sqlPromise, CONNECTION, INSERT_DEFERRED_STMT, ['foo', JSON.stringify(payload)]));
  expect(gen.next().done).toBe(true);
});

test('end computation side effect', ()=>{  
  const gen = endComputationSideEffect({
    payload: {}
  });
  expect(gen.next().value).toEqual(select(stateSelector));
  expect(gen.next(state).value).toEqual(call(beginTransaction, CONNECTION));
  expect(gen.next().value).toEqual(call(sqlPromise, CONNECTION, DECREASE_CONNECTION_COUNT_STATEMENT, ['connections']));
  expect(gen.next().value).toEqual(call(sqlPromise, CONNECTION, SELECT_CONNECTIONS_STMT, ['connections']));
  expect(gen.next([{ connections: 50 }]).value).toEqual(call(sqlPromise, CONNECTION, SELECT_DEFFERED_STMT, [150]));
  expect(gen.next([{
    id: 'foo',
    json: '{"bar": 1}'
  },{
    id: 'bar',
    json: '{"foo": 2}'
  }]).value).toEqual(call(sqlPromise, CONNECTION, 'DELETE FROM deferred WHERE id = ? OR id = ?;', ['foo', 'bar']));
  expect(gen.next().value).toEqual(call(commitTransaction, CONNECTION));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {bar: 1}));
  expect(gen.next().value).toEqual(call(newComputationSideEffect, CONNECTION, ENV, {foo: 2}));
  expect(gen.next().value).toEqual(call(destroy, CONNECTION));
  expect(gen.next().value).toEqual(call(deleteLambda, {
    
  }));
  expect(gen.next().done).toBe(true);
});

test('function name from payload', ()=>{
  expect(functionNameFromPayload({
    _computationAction: 'GET_REPO',
    _computationOwner: 'reactjs',
    _computationRepo: 'redux'
  })).toBe('GET_REPO_3c797270_7490fe17');
  expect(functionNameFromPayload({
    _computationAction: 'GET_REPOS',
    _computationSince: 300
  })).toBe('GET_REPOS_300');
  expect(functionNameFromPayload({
    _computationAction: 'GET_LAST',
    _computationOwner: 'reactjs',
    _computationRepo: 'redux'
  })).toBe('GET_LAST_3c797270_7490fe17');
  expect(functionNameFromPayload({
    _computationAction: 'GET_COMMIT',
    _computationSHA: 'ff8b847adc6026f4c15aee218fa96577'
  })).toBe('GET_COMMIT_ff8b847a');
  expect(functionNameFromPayload({
    _computationAction: 'GET_COMMITS',
    _computationCommitCount: 0,
    _computationOwner: 'reactjs',
    _computationRepo: 'redux',
  })).toBe('GET_COMMITS_3c797270_7490fe17_0');
});
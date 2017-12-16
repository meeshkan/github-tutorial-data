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
  lambdaSideEffect,
  createFunction,
  invokeFunction,
  endLambdaSideEffect,
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
  END_LAMBDA,
  endLambda,
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
    _lambdaOwner: 'Meeshkan',
    _lambdaRepo: 'redux-ize'
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
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaId: 110536681,
    _lambdaOwner: "Meeshkan",
    _lambdaRepo: "redux-ize",
    _lambdaAction: GET_LAST
  }));
  expect(gen.next().value).toEqual(put(endLambda(payload)));
  expect(gen.next().done).toBe(true);
});

test('get commit side effect', () => {
  const payload = {
    _lambdaId: 110536681,
    _lambdaSHA: "84d1bbf0643eacaf94685155cd53ae170b561e1b",
    _lambdaOwner: 'Meeshkan',
    _lambdaRepo: 'redux-ize'
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
  expect(gen.next().value).toEqual(put(endLambda(payload)));
  expect(gen.next().done).toBe(true);
});

test('get last side effect', () => {
  const payload = {
    _lambdaId: 110536681,
    _lambdaOwner: 'redux-saga',
    _lambdaRepo: 'redux-saga'
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
  }).value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaId: 110536681,
    _lambdaOwner: "redux-saga",
    _lambdaRepo: "redux-saga",
    _lambdaAction: GET_COMMITS,
    _lambdaCommitCount: 0,
    _lambdaPage: 47
  }));
  expect(gen.next().value).toEqual(put(endLambda(payload)));
  expect(gen.next().done).toBe(true);
});

test('get repos side effect', () => {
  const payload = {
    _lambdaSince: 308249
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
  }).value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "bsy",
    _lambdaRepo: "easyslider"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "tns",
    _lambdaRepo: "ContainerFu"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "revans",
    _lambdaRepo: "versioning"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "sodabrew",
    _lambdaRepo: "libsieve"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "turian",
    _lambdaRepo: "common"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "canadas",
    _lambdaRepo: "ufo"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "ysimonson",
    _lambdaRepo: "oz"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "crcx",
    _lambdaRepo: "colors"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "kyungyonglee",
    _lambdaRepo: "ClassAd_Csharp"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "directeur",
    _lambdaRepo: "socnode"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "liquuid",
    _lambdaRepo: "macsmc"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "ekfriis",
    _lambdaRepo: "dotfiles"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "jeremyd",
    _lambdaRepo: "rest_connection"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "pshomov",
    _lambdaRepo: "greendale"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "anileech",
    _lambdaRepo: "AniLeech-Development"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "nriley",
    _lambdaRepo: "Make-Flashcards"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "sorah",
    _lambdaRepo: "sandbox"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "objcode",
    _lambdaRepo: "paisley"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "nskim",
    _lambdaRepo: "Find-Max-SMBD"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "Schevo",
    _lambdaRepo: "xdserver"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "asolove",
    _lambdaRepo: "learn-scheme"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "kevinsheffield",
    _lambdaRepo: "MonoTouchDemos"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "SnacksOnAPlane",
    _lambdaRepo: "debately-site"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "elitheeli",
    _lambdaRepo: "RubyCAP"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "azmaveth",
    _lambdaRepo: "azmaveth"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "chorny",
    _lambdaRepo: "AI-MegaHAL"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "kjg",
    _lambdaRepo: "derailleur"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "chorny",
    _lambdaRepo: "Hook-LexWrap"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "dascgo",
    _lambdaRepo: "Twitter-Follower-Search"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "taouk66",
    _lambdaRepo: "fourHundred"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "jhsu",
    _lambdaRepo: "DMS315"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "juniperoserra",
    _lambdaRepo: "upfork-particles"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "leathekd",
    _lambdaRepo: "plex_railscasts_plugin"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "sunspot82",
    _lambdaRepo: "605.484"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "afairley",
    _lambdaRepo: "OpenGov-Hack-Day-Melting-Pot"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "jri",
    _lambdaRepo: "deepamehta3-v0.3"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "atgreen",
    _lambdaRepo: "uClibc-moxie"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "MikeThacker",
    _lambdaRepo: "myGSFN"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "merchantfraud",
    _lambdaRepo: "merchantfraud.github.com"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "dcrec1",
    _lambdaRepo: "signal"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "dekz",
    _lambdaRepo: "carto"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "Chip000",
    _lambdaRepo: "EQM"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "flyerhzm",
    _lambdaRepo: "rfetion"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "wezm",
    _lambdaRepo: "Gare-du-Nord"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "cedric329",
    _lambdaRepo: "cedric-music"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "sumihiro",
    _lambdaRepo: "iPhoneHTTPProxyServer"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "dbuckalew",
    _lambdaRepo: "gbook"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "soudabeh",
    _lambdaRepo: "project-1"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "soudabeh",
    _lambdaRepo: "1"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "1989gaurav",
    _lambdaRepo: "xdc"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "mannd",
    _lambdaRepo: "morbidmeter"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "ralsina",
    _lambdaRepo: "rst-cheatsheet"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "pjfitzgibbons",
    _lambdaRepo: "FonsecaMartialArts.com"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "kenearley",
    _lambdaRepo: "Tabbox-Module"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "jamiew",
    _lambdaRepo: "1click-exploitables"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "lulurun",
    _lambdaRepo: "fanni"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "azwanmohd",
    _lambdaRepo: "latex_progress2"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "jgm",
    _lambdaRepo: "rocks"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "zacharyp",
    _lambdaRepo: "Math-Robot"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "woody1983",
    _lambdaRepo: "Railscoders-for-Rails2.3.3"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "symphonists",
    _lambdaRepo: "url_segments"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPO",
    _lambdaOwner: "bigbenbt",
    _lambdaRepo: "math666hw1partb"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_REPOS",
    _lambdaSince: 308500,
    _lambdaReposCount: 62,
  }));
  expect(gen.next().value).toEqual(put(endLambda(payload)));
  expect(gen.next().done).toBe(true);
});

test('get commits side effect', () => {
  const payload = {
    _lambdaPage: 33,
    _lambdaId: 36535156,
    _lambdaOwner: 'reactjs',
    _lambdaRepo: 'redux'
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
  }).value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "a9ce9a2eb04636f5e595d14d67a67b27eb713f2a",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "7489e5796b79db5383cf196b05243f4ac5486395",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "d2969b5e5a1fcc1489feec0a4fcc06f92e1a3e6b",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "ee5b52e06043591c26c2ec5cf1c345c9adc5a6c1",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "7ef187a663c83014f6347a65376bcbc971eca294",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "83353b8e82277bab32cc7a4e098616b35d372a6c",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "855ac391958015beb1c6bb1f6c5e5550d387b9d3",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "8ef7d2a6d60d112c2379c124da85796ca3380247",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "c221a5f03c2713911dff49d85c818393c4b69a7a",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "7bac7ecb0d15c164035576177d191d2c461d01e6",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "6de14f4881e5fc6a4a6e0ce86e88a967d46802a3",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "c30d75fe4a23a3552c4131f0593edcc334eec7d0",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "b7b456ba5b91b84a41e1bfa59d7d3ef61c3eb5c5",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "a7b676ec51ece3ac5fd2ec38322f1840080831ad",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "cfbdc178174b24e27001d358bec61962a6e21097",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "b35c1c95432e793df92609938ae79be96788e09e",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "18949fd25060fd89c3edaae431a74770adb2f43b",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "f6e29040d8164174095b9223b6d46c6962faf22f",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "ed2617192e57de5ea85d1dde4c5fd8997161445d",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "c7e8e45d5916b27fe85f60bc0ae59cb4987ec421",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "6d37efbb8ae805577659e988aa9c09d138e4c6e2",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "891a97cd3e9a6c8ecea88087bfa3bec878f2ae0a",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "9686011a3b7efd0007e38285b45bd05456e7bc8d",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "2c69ff2c2b38bb5a0596fa6eff16bbc2c629ef7e",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "5e996af1a0d2ee18b6b5a2d61b12e311cf0b6834",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "b137e1eb7599507c29282bdcf456ac2c47850457",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "44003e379b67b038a1a071ec588a1be9cc111b18",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "ff534e6a2a9ded3a4f39b2857f361ffc7904efb0",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "ec0b1a36e958584b7a11a5977734f04d05955c22",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: "GET_COMMIT",
    _lambdaId: 36535156,
    _lambdaSHA: "e1b2a95e7e4fd6ce4d5939f15744a715a6e94190",
    _lambdaOwner: "reactjs",
    _lambdaRepo: "redux"
  }))
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {
    _lambdaAction: GET_COMMITS,
    _lambdaPage: 32,
    _lambdaCommitCount: 30,
    _lambdaId: 36535156,
    _lambdaOwner: 'reactjs',
    _lambdaRepo: 'redux'
  }))
  expect(gen.next().value).toEqual(put(endLambda(payload)));
  expect(gen.next().done).toBe(true);
});

test('lambda side effect happy path', () => {
  const gen = lambdaSideEffect(CONNECTION, ENV, {
    _lambdaAction: "GET_REPOS",
    _lambdaSince: 100
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
      _lambdaAction: "GET_REPOS",
      _lambdaSince: 100,
      _lambdaFunctionName: 'GithubTutorial_GET_REPOS_100'
    })
  }));
  expect(gen.next().done).toBe(true);
});

test('lambda side effect too many connections', () => {
  const payload = {
    _lambdaAction: "GET_REPOS",
    _lambdaSince: 100
  };
  const gen = lambdaSideEffect(CONNECTION, ENV, payload);
  expect(gen.next().value).toEqual(call(sqlPromise, CONNECTION, SELECT_CONNECTIONS_STMT, ['connections']));
  expect(gen.next([{
    connections: 201
  }]).value).toEqual(call(uuidv4));
  expect(gen.next('foo').value).toEqual(call(sqlPromise, CONNECTION, INSERT_DEFERRED_STMT, ['foo', JSON.stringify(payload)]));
  expect(gen.next().done).toBe(true);
});

test('end lambda side effect', ()=>{  
  const gen = endLambdaSideEffect({
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
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {bar: 1}));
  expect(gen.next().value).toEqual(call(lambdaSideEffect, CONNECTION, ENV, {foo: 2}));
  expect(gen.next().value).toEqual(call(destroy, CONNECTION));
  expect(gen.next().value).toEqual(call(deleteLambda, {
    
  }));
  expect(gen.next().done).toBe(true);
});

test('function name from payload', ()=>{
  expect(functionNameFromPayload({
    _lambdaAction: 'GET_REPO',
    _lambdaOwner: 'reactjs',
    _lambdaRepo: 'redux'
  })).toBe('GET_REPO_3c797270_7490fe17');
  expect(functionNameFromPayload({
    _lambdaAction: 'GET_REPOS',
    _lambdaSince: 300
  })).toBe('GET_REPOS_300');
  expect(functionNameFromPayload({
    _lambdaAction: 'GET_LAST',
    _lambdaOwner: 'reactjs',
    _lambdaRepo: 'redux'
  })).toBe('GET_LAST_3c797270_7490fe17');
  expect(functionNameFromPayload({
    _lambdaAction: 'GET_COMMIT',
    _lambdaSHA: 'ff8b847adc6026f4c15aee218fa96577'
  })).toBe('GET_COMMIT_ff8b847a');
  expect(functionNameFromPayload({
    _lambdaAction: 'GET_COMMITS',
    _lambdaCommitCount: 0,
    _lambdaOwner: 'reactjs',
    _lambdaRepo: 'redux',
  })).toBe('GET_COMMITS_3c797270_7490fe17_0');
});
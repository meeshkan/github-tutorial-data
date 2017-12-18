import {
  GET_REPO,
  GET_REPOS,
  GET_LAST,
  GET_COMMIT,
  GET_COMMITS,
  GET_TASKS,
  getTasks,
  decreaseRemaining,
  increaseExecutionCount,
  decreaseExecutionCount
} from './actions';

import Raven from 'raven';

import uuidv4 from 'uuid/v4';

import crypto from 'crypto';

import urlparse from 'url-parse';

import axios from 'axios';

import {
  INSERT_REPO_STMT,
  INSERT_COMMIT_STMT,
  INSERT_DEFERRED_STMT,
  SELECT_DEFERRED_STMT,
  DELETE_DEFERRED_STMT,
  SELECT_UNFULFILLED_STMT,
  SELECT_EXECUTING_STATEMENT,
  DECREASE_EXECUTING_STATEMENT,
  CHANGE_UNFULFILLED_STATEMENT,
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
  sqlPromise,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  destroy
} from './util';

import AWS from 'aws-sdk';

export const stateSelector = $ => $;

export const createFunction = params => new Promise((resolve, reject) => new AWS.EC2({
  region: 'us-east-1'
}).requestSpotInstances(params, (e, r) => e ? reject(e) : resolve(r)));
export const easyMD5 = data => crypto.createHash('md5').update(data).digest("hex").substring(0, 8);

// decrease remaining
// boot up new server if we have outstanding tasks
export function* beginSagaPart(action) {
  yield put(increaseExecutionCount());
  const {
    connection,
    env,
    remaining
  } = yield select(stateSelector);
  yield put(decreaseRemaining());
  if (remaining <= 0) {
    // defer
    const uuid = yield call(uuidv4);
    yield call(sqlPromise, connection, INSERT_DEFERRED_STMT, [uuid, JSON.stringify(action)]);
    return false;
  }
  return true;
}

export const exitProcess = () => process.exit(0);

export function* endSagaPart() {
  yield put(decreaseExecutionCount());
  const {
    connection,
    env,
    remaining,
    executing
  } = yield select(stateSelector);
  if (remaining > 0) {
    // we get some more tasks
    // in the worst case, we can get and re-defer them
    yield put(getTasks(remaining));
  } else if (executing <= 0) {
    // this is cleanup work for the job
    try {
      // the bloc below is laborious but necessary to keep the number of servers down
      // otherwise, we could get into the situation where we spawn a server for just a few jobs
      // because each server has a four-minute start up time, if we are only using it for a few jobs, it becomes very costly
      // so, we only spawn a server when we are sure to have (mod) 60 jobs and add the rest to an unfulfilled table
      // for the corner case where we only have one server executing and jobs to do, we make sure to spawn at least one server
      yield call(beginTransaction, connection);
      const _unfulfilled = yield call(sqlPromise, connection, SELECT_UNFULFILLED_STMT, ['unfulfilled']); // get how many unfulfilled functions there are
      const unfulfilled = _unfulfilled.length > 0 ? parseInt(_unfulfilled[0].unfulfilled || 0) : 0;
      const totalUnfulfilled = unfulfilled + (remaining * -1); // the total unfulfilled is what is remaining from other machines plus this machine
      const executing = yield call(sqlPromise, connection, SELECT_EXECUTING_STATEMENT, ['executing']); // how many jobs are executing
      const totalExecuting = parseInt(executing[0].executing);
      const functionsToLaunch = Math.min((totalExecuting === 1 ? Math.ceil : Math.floor)(totalUnfulfilled / parseInt(env.GITHUB_API_LIMIT || 60)), parseInt(env.MAX_COMPUTATIONS || 950) - totalExecuting); // we launch enough machines to cover unfulfilled jobs while not going over our max
      yield call(sqlPromise, connection, DECREASE_EXECUTING_STATEMENT, ['executing']); // we decrease the number of executing jobs
      const newUnfulfilled = Math.max((remaining * -1) + unfulfilled - (functionsToLaunch * parseInt(env.GITHUB_API_LIMIT)), 0); // the new amount of unfulfilled jobs after the launch
      yield call(sqlPromise, connection, CHANGE_UNFULFILLED_STATEMENT, ['unfulfilled', newUnfulfilled, newUnfulfilled]);
      yield call(commitTransaction, connection);
      // we don't need the connection anymore, so we release it to the pool
      yield call(destroy, connection);
      const USER_DATA = `#!/bin/bash
export RAVEN_URL="${env.RAVEN_URL}" && \
export MY_SQL_HOST="${env.MY_SQL_HOST}" && \
export MY_SQL_PORT="${env.MY_SQL_PORT}" && \
export MY_SQL_USERNAME="${env.MY_SQL_USERNAME}" && \
export MY_SQL_PASSWORD="${env.MY_SQL_PASSWORD}" && \
export MY_SQL_DATABASE="${env.MY_SQL_DATABASE}" && \
export MY_SQL_SSL="${env.MY_SQL_SSL}" && \
export GITHUB_API="${env.GITHUB_API}" && \
export MAX_REPOS="${env.MAX_REPOS}" && \
export MAX_COMMITS="${env.MAX_COMMITS}" && \
export ERROR_TOPIC_ARN="${env.ERROR_TOPIC_ARN}" && \
export SHOULD_STOP_FUNCTION="${env.SHOULD_STOP_FUNCTION}" && \
export MAX_COMPUTATIONS="${env.MAX_COMPUTATIONS}" && \
export PACKAGE_URL="${env.PACKAGE_URL}" && \
export PACKAGE_NAME="${env.PACKAGE_NAME}" && \
export PACKAGE_FOLDER="${env.PACKAGE_FOLDER}" && \
export GITHUB_API_LIMIT="${env.GITHUB_API_LIMIT}" && \
export GITHUB_TUTORIAL_DRY_RUN="${env.GITHUB_TUTORIAL_DRY_RUN}" && \
export GITHUB_TUTORIAL_SUBNET_ID="${env.GITHUB_TUTORIAL_SUBNET_ID}" && \
export GITHUB_TUTORIAL_SECURITY_GROUP_ID="${env.GITHUB_TUTORIAL_SECURITY_GROUP_ID}" && \
export GITHUB_TUTORIAL_IAM_INSTANCE_ARN="${env.GITHUB_TUTORIAL_IAM_INSTANCE_ARN}" && \
export GITHUB_TUTORIAL_IMAGE_ID="${env.GITHUB_TUTORIAL_IMAGE_ID}" && \
wget $PACKAGE_URL && \
unzip $PACKAGE_NAME && \
cd $PACKAGE_FOLDER && \
node index.js
shutdown -h now
`;
      let i = 0;
      for (; i < functionsToLaunch; i++) {
        const createFunctionParams = {
          InstanceCount: 1,
          DryRun: JSON.parse(env.GITHUB_TUTORIAL_DRY_RUN || 'false'),
          InstanceInitiatedShutdownBehavior: 'terminate',
          LaunchSpecification: {
            InstanceType: 't2.micro',
            SubnetId: env.GITHUB_TUTORIAL_SUBNET_ID,
            SecurityGroupIds: [
              env.GITHUB_TUTORIAL_SECURITY_GROUP_ID
            ],
            IamInstanceProfile: {
              Arn: env.GITHUB_TUTORIAL_IAM_INSTANCE_ARN
            },
            Monitoring: {
              Enabled: false
            },
            ImageId: env.GITHUB_TUTORIAL_IMAGE_ID,
            UserData: new Buffer(USER_DATA).toString('base64')
          },
          SpotPrice: "0.0043",
          Type: "one-time"
        };
        yield call(createFunction, createFunctionParams);
      }
    } catch (e) {
      yield call(rollbackTransaction, connection);
      Raven.captureException(e);
      yield call(destroy, connection);
    } finally {
      // a forced exit would be necessary if, for example, the connection does not close
      yield call(exitProcess);
    }
  }
}

export function* getTasksSideEffect(action) {
  const {
    connection,
    env
  } = yield select(stateSelector);
  const {
    payload
  } = action;
  try {
    yield call(beginTransaction, connection);
  } catch (e) {
    Raven.captureException(e);
    return;
  }
  let newActions = null;
  try {
    const tasks = yield call(sqlPromise, connection, SELECT_DEFERRED_STMT, [payload]);
    if (tasks.length > 0) {
      yield call(sqlPromise, connection, DELETE_DEFERRED_STMT(tasks), tasks.map(t => t.id));
      newActions = tasks.map(t => JSON.parse(t.json));
    }
  } catch (e) {
    yield call(rollbackTransaction, connection);
    Raven.captureException(e);
  }
  if (newActions) {
    let i = 0;
    for (; i < newActions.length; i++) {
      yield put(newActions[i]);
    }
  }
}

export function* getRepoSideEffect(action) {
  const {
    connection,
    env
  } = yield select(stateSelector);
  try {
    const {
      payload
    } = action;
    const shouldAdvance = yield call(beginSagaPart, action);
    if (!shouldAdvance) {
      throw new Error("cannot advance anymore");
    }
    const repo = yield call(axios, `${env.GITHUB_API}/repos/${payload._computationOwner}/${payload._computationRepo}`);
    const fork = repo && repo.data ? repo.data.fork : null;
    if (fork) {
      throw new Error("no forks allowed"); // we do not use forks
    }
    const id = repo && repo.data ? parseInt(repo.data.id) : null;
    if (id === null) {
      throw new Error("no id error"); // cannot insert into the DB without an id
    }
    const owner_login = repo && repo.data && repo.data.owner ? repo.data.owner.login : null;
    const owner_id = repo && repo.data && repo.data.owner ? parseInt(repo.data.owner.id) : null;
    const name = repo && repo.data ? repo.data.name : null;
    const full_name = repo && repo.data ? repo.data.full_name : null;
    const language = repo && repo.data ? repo.data.language : null;
    const forks_count = repo && repo.data ? parseInt(repo.data.forks_count) : null;
    const stargazers_count = repo && repo.data ? parseInt(repo.data.stargazers_count) : null;
    const watchers_count = repo && repo.data ? parseInt(repo.data.watchers_count) : null;
    const subscribers_count = repo && repo.data ? parseInt(repo.data.subscribers_count) : null;
    const size = repo && repo.data ? parseInt(repo.data.size) : null;
    const has_issues = repo && repo.data ? repo.data.has_issues ? 1 : 0 : null;
    const has_wiki = repo && repo.data ? repo.data.has_wiki ? 1 : 0 : null;
    const has_pages = repo && repo.data ? repo.data.has_pages ? 1 : 0 : null;
    const has_downloads = repo && repo.data ? repo.data.has_downloads ? 1 : 0 : null;
    const pushed_at = repo && repo.data && repo.data.pushed_at ? new Date(repo.data.pushed_at).getTime() : null;
    const created_at = repo && repo.data && repo.data.created_at ? new Date(repo.data.created_at).getTime() : null;
    const updated_at = repo && repo.data && repo.data.updated_at ? new Date(repo.data.updated_at).getTime() : null;
    yield call(sqlPromise, connection, INSERT_REPO_STMT, [
      id, owner_login, owner_id, name, full_name, language, forks_count, stargazers_count, watchers_count, subscribers_count, size, has_issues, has_wiki, has_pages, has_downloads, pushed_at, created_at, updated_at,
      owner_login, owner_id, name, full_name, language, forks_count, stargazers_count, watchers_count, subscribers_count, size, has_issues, has_wiki, has_pages, has_downloads, pushed_at, created_at, updated_at
    ]);
    yield put({
      type: GET_LAST,
      payload: {
        _computationId: id,
        _computationOwner: payload._computationOwner,
        _computationRepo: payload._computationRepo
      }
    });
  } catch (e) {
    Raven.captureException(e);
  } finally {
    yield call(endSagaPart);
  }
}

export function* getReposSideEffect(action) {
  const {
    connection,
    env
  } = yield select(stateSelector);
  try {
    const {
      payload
    } = action;
    const shouldAdvance = yield call(beginSagaPart, action);
    if (!shouldAdvance) {
      throw new Error("cannot advance anymore");
    }
    const repos = yield call(axios, `${env.GITHUB_API}/repositories?since=${payload._computationSince}`);
    let i = 0;
    if (repos && repos.data) {
      const useableRepos = repos.data.filter(r => !r.fork)
      for (; i < useableRepos.length; i++) {
        if (!useableRepos[i].name || !useableRepos[i].owner || !useableRepos[i].owner.login) {
          continue;
        }
        yield put({
          type: GET_REPO,
          payload: {
            _computationOwner: useableRepos[i].owner.login,
            _computationRepo: useableRepos[i].name
          }
        }); // repo data
      }
      const next = /<(.|\n)*?>/g.exec(repos.headers['Link'].split(',').filter(x => x.indexOf('rel="next"') !== -1)[0])[0].replace('<', '').replace('>', '');
      const since = parseInt(urlparse(next).query.substring(1).split('&').filter(x => x.indexOf('since=') !== -1)[0].split('=')[1]);
      const updatedCount = parseInt(payload._computationReposCount || 0) + useableRepos.length;
      if (updatedCount < parseInt(env.MAX_REPOS)) {
        yield put({
          type: GET_REPOS,
          payload: {
            _computationSince: since,
            _computationReposCount: updatedCount
          }
        }); // get next batch of repos
      }
    }
  } catch (e) {
    Raven.captureException(e);
  } finally {
    yield call(endSagaPart);
  }
}

export function* getLastSideEffect(action) {
  const {
    connection,
    env
  } = yield select(stateSelector);
  try {
    const {
      payload
    } = action;
    const shouldAdvance = yield call(beginSagaPart, action);
    if (!shouldAdvance) {
      throw new Error("cannot advance anymore");
    }
    const commit = yield call(axios, `https://api.github.com/repos/${payload._computationOwner}/${payload._computationRepo}/commits`);
    const last = /<(.|\n)*?>/g.exec(commit.headers['Link'].split(',').filter(x => x.indexOf('rel="last"') !== -1)[0])[0].replace('<', '').replace('>', '');
    const page = parseInt(urlparse(last).query.substring(1).split('&').filter(x => x.indexOf('page=') !== -1)[0].split('=')[1]);
    yield put({
      type: GET_COMMITS,
      payload: {
        _computationPage: page,
        _computationCommitCount: 0,
        _computationId: payload._computationId,
        _computationOwner: payload._computationOwner,
        _computationRepo: payload._computationRepo
      }
    }); // get commits
  } catch (e) {
    Raven.captureException(e);
  } finally {
    yield call(endSagaPart);
  }
}

export function* getCommitsSideEffect(action) {
  const {
    connection,
    env
  } = yield select(stateSelector);
  try {
    const {
      payload
    } = action;
    const shouldAdvance = yield call(beginSagaPart, action);
    if (!shouldAdvance) {
      throw new Error("cannot advance anymore");
    }
    const commits = yield call(axios, `https://api.github.com/repositories/${payload._computationId}/commits?page=${payload._computationPage}`);
    if (commits && commits.data && commits.data.length) {
      let i = 0;
      for (; i < commits.data.length; i++) {
        if (commits.data[i].sha) {
          yield put({
            type: GET_COMMIT,
            payload: {
              _computationId: payload._computationId,
              _computationSHA: commits.data[i].sha,
              _computationOwner: payload._computationOwner,
              _computationRepo: payload._computationRepo
            }
          }); // commit data;
        }
      }
      const updatedCount = parseInt(payload._computationCommitCount || 0) + commits.data.length;
      if (payload._computationPage > 1 && updatedCount < parseInt(env.MAX_COMMITS)) {
        yield put({
          type: GET_COMMITS,
          payload: {
            _computationPage: payload._computationPage - 1,
            _computationCommitCount: updatedCount,
            _computationId: payload._computationId,
            _computationOwner: payload._computationOwner,
            _computationRepo: payload._computationRepo
          }
        }); // get commits again
      }
    }
  } catch (e) {
    Raven.captureException(e);
  } finally {
    yield call(endSagaPart);
  }
}

export function* getCommitSideEffect(action) {
  const {
    connection,
    env
  } = yield select(stateSelector);
  try {
    const {
      payload
    } = action;
    const shouldAdvance = yield call(beginSagaPart, action);
    if (!shouldAdvance) {
      throw new Error("cannot advance anymore");
    }
    const commit = yield call(axios, `${env.GITHUB_API}/repos/${payload._computationOwner}/${payload._computationRepo}/commits/${payload._computationSHA}`);
    const sha = commit && commit.data ? commit.data.sha : null;
    if (sha === null) {
      throw new Error("no sha error"); // cannot insert into the DB without an sha
    }
    const repo_id = parseInt(payload._computationId);
    const author_name = commit && commit.data && commit.data.commit && commit.data.commit.author ? commit.data.commit.author.name : null;
    const author_email = commit && commit.data && commit.data.commit && commit.data.commit.author ? commit.data.commit.author.email : null;
    const author_date = commit && commit.data && commit.data.commit && commit.data.commit.author ? new Date(commit.data.commit.author.date).getTime() : null;
    const committer_name = commit && commit.data && commit.data.commit && commit.data.commit.committer ? commit.data.commit.committer.name : null;
    const committer_email = commit && commit.data && commit.data.commit && commit.data.commit.committer ? commit.data.commit.committer.email : null;
    const committer_date = commit && commit.data && commit.data.commit && commit.data.commit.committer ? new Date(commit.data.commit.committer.date).getTime() : null;
    const author_login = commit && commit.data && commit.data.author ? commit.data.author.login : null;
    const author_id = commit && commit.data && commit.data.author ? parseInt(commit.data.author.id) : null;
    const committer_login = commit && commit.data && commit.data.committer ? commit.data.committer.login : null;
    const committer_id = commit && commit.data && commit.data.committer ? parseInt(commit.data.committer.id) : null;
    const additions = commit && commit.data && commit.data.stats ? parseInt(commit.data.stats.additions) : null;
    const deletions = commit && commit.data && commit.data.stats ? parseInt(commit.data.stats.deletions) : null;
    const total = commit && commit.data && commit.data.stats ? parseInt(commit.data.stats.total) : null;
    const test_additions = commit && commit.data && commit.data.files ? commit.data.files.filter(f => f.filename && /(^test|[^a-zA-Z]+test|Test)/g.exec(f.filename)).map(f => parseInt(f.additions)).reduce((a, b) => a + b, 0) : null;
    const test_deletions = commit && commit.data && commit.data.files ? commit.data.files.filter(f => f.filename && /(^test|[^a-zA-Z]+test|Test)/g.exec(f.filename)).map(f => parseInt(f.deletions)).reduce((a, b) => a + b, 0) : null;
    const test_changes = commit && commit.data && commit.data.files ? commit.data.files.filter(f => f.filename && /(^test|[^a-zA-Z]+test|Test)/g.exec(f.filename)).map(f => parseInt(f.changes)).reduce((a, b) => a + b, 0) : null;
    yield call(sqlPromise, connection, INSERT_COMMIT_STMT, [
      sha, repo_id, author_name, author_email, author_date, committer_name, committer_email, committer_date, author_login, author_id, committer_login, committer_id, additions, deletions, total, test_additions, test_deletions, test_changes,
      repo_id, author_name, author_email, author_date, committer_name, committer_email, committer_date, author_login, author_id, committer_login, committer_id, additions, deletions, total, test_additions, test_deletions, test_changes
    ]); // update commit
  } catch (e) {
    Raven.captureException(e);
  } finally {
    yield call(endSagaPart);
  }
}

function* githubSaga() {
  yield takeEvery(GET_LAST, getLastSideEffect);
  yield takeEvery(GET_COMMIT, getCommitSideEffect);
  yield takeEvery(GET_COMMITS, getCommitsSideEffect);
  yield takeEvery(GET_REPO, getRepoSideEffect);
  yield takeEvery(GET_REPOS, getReposSideEffect);
  yield takeEvery(GET_TASKS, getTasksSideEffect);
}

export default githubSaga;
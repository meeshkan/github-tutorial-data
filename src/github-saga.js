import {
  GET_REPO,
  GET_REPOS,
  GET_LAST,
  GET_COMMIT,
  GET_COMMITS,
  END_COMPUTATION,
  endComputation
} from './actions';

import uuidv4 from 'uuid/v4';

import crypto from 'crypto';

import urlparse from 'url-parse';

import axios from 'axios';

import {
  INSERT_REPO_STMT,
  INSERT_COMMIT_STMT,
  SELECT_CONNECTIONS_STMT,
  INSERT_DEFERRED_STMT,
  DECREASE_CONNECTION_COUNT_STATEMENT,
  SELECT_DEFFERED_STMT
} from './sql';

import {
  call,
  put,
  select,
  takeEvery
} from 'redux-saga/effects';

import {
  sqlPromise,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
} from './util';

export const stateSelector = $ => $;

export const createFunction = params => new Promise((resolve, reject) => new AWS.Lambda().createFunction(params, (e, r) => e ? reject(e) : resolve(r)));
export const invokeFunction = params => new Promise((resolve, reject) => new AWS.Lambda().invoke(params, (e, r) => e ? reject(e) : resolve(r)));

export const easyMD5 = data => crypto.createHash('md5').update(data).digest("hex").substring(0,8);

export const functionNameFromPayload = payload => {
  switch (payload._computationAction) {
    case GET_REPO:
      return `${GET_REPO}_${easyMD5(payload._computationOwner)}_${easyMD5(payload._computationRepo)}`
    case GET_REPOS:
      return `${GET_REPOS}_${payload._computationSince}`
    case GET_LAST:
      return `${GET_LAST}_${easyMD5(payload._computationOwner)}_${easyMD5(payload._computationRepo)}`
    case GET_COMMIT:
      return `${GET_COMMIT}_${payload._computationSHA.substring(0,8)}`
    case GET_COMMITS:
      return `${GET_COMMITS}_${easyMD5(payload._computationOwner)}_${easyMD5(payload._computationRepo)}_${parseInt(payload._computationCommitCount || 0)}`
    default:
      throw new Error("CANNOT_NAME_FUNCTION_ERROR");
  }
}

// we don't wrap this in a try block because it should raise errors
export function* newComputationSideEffect(connection, env, payload) {
  const concurrentCount = yield call(sqlPromise, connection, SELECT_CONNECTIONS_STMT, ['connections']);
  if (concurrentCount.length === 0 || parseInt(concurrentCount[0].connections) >= parseInt(env.MAX_LAMBDAS)) {
    const uuid = yield call(uuidv4);
    yield call(sqlPromise, connection, INSERT_DEFERRED_STMT, [uuid, JSON.stringify(payload)]);
  } else {
    // deploy the computation
    const functionName = `GithubTutorial_${functionNameFromPayload(payload)}`;
    const createFunctionParams = {
      Code: {
        S3Bucket: env.LAMBDA_FUNCTION_S3_BUCKET,
        S3Key: env.LAMBDA_FUNCTION_S3_KEY
      },
      FunctionName: functionName,
      Handler: 'index.handler',
      Role: env.LAMBDA_ROLE,
      Runtime: 'nodejs4.3',
      Environment: {
        Variables: {
          MAX_LAMBDAS: env.MAX_LAMBDAS,
          LAMBDA_FUNCTION_S3_BUCKET: env.LAMBDA_FUNCTION_S3_BUCKET,
          LAMBDA_FUNCTION_S3_KEY: env.LAMBDA_FUNCTION_S3_KEY,
          LAMBDA_ROLE: env.LAMBDA_ROLE,
          LAMBDA_SECURITY_GROUP: env.LAMBDA_SECURITY_GROUP,
          LAMBDA_SUBNET_1: env.LAMBDA_SUBNET_1,
          LAMBDA_SUBNET_2: env.LAMBDA_SUBNET_2,
          LAMBDA_SUBNET_3: env.LAMBDA_SUBNET_3,
          MY_SQL_HOST: env.MY_SQL_HOST,
          MY_SQL_PORT: env.MY_SQL_PORT,
          MY_SQL_USERNAME: env.MY_SQL_USERNAME,
          MY_SQL_PASSWORD: env.MY_SQL_PASSWORD,
          MY_SQL_DATABASE: env.MY_SQL_DATABASE,
          MY_SQL_SSL: env.MY_SQL_SSL,
          GITHUB_API: env.GITHUB_API,
          MAX_REPOS: env.MAX_REPOS,
          MAX_COMMITS: env.MAX_COMMITS,
          SHOULD_STOP_FUNCTION: env.SHOULD_STOP_FUNCTION,
          INVOCATION_TYPE: env.INVOCATION_TYPE
        }
      },
      MemorySize: 128,
      Publish: true,
      Timeout: 15,
      VpcConfig: {
        SecurityGroupIds: [
          env.LAMBDA_SECURITY_GROUP
        ],
        SubnetIds: [
          env.LAMBDA_SUBNET_1,
          env.LAMBDA_SUBNET_2,
          env.LAMBDA_SUBNET_3,
        ]
      }
    };
    yield call(createFunction, createFunctionParams);
    const invokeFunctionParams = {
      InvocationType: env.INVOCATION_TYPE,
      FunctionName: functionName,
      Payload: JSON.stringify({
        ...payload,
        _computationFunctionName: functionName
      })
    };
    // invoke the computation
    yield call(invokeFunction, invokeFunctionParams);
  };
};

export function* getRepoSideEffect(action) {
  try {
    const {
      connection,
      env
    } = yield select(stateSelector);
    const {
      payload
    } = action;
    const repo = yield call(axios, `${env.GITHUB_API}/repos/${payload._computationOwner}/${payload._computationRepo}`);
    const fork = repo && repo.data ? repo.data.fork : null;
    if (fork) {
      return; // we do not use forks
    }
    const id = repo && repo.data ? parseInt(repo.data.id) : null;
    if (id === null) {
      return; // cannot insert into the DB without an id
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
    const pushed_at = repo && repo.data ? repo.data.pushed_at : null;
    const created_at = repo && repo.data ? repo.data.created_at : null;
    const updated_at = repo && repo.data ? repo.data.updated_at : null;
    yield call(sqlPromise, connection, INSERT_REPO_STMT, [
      id, owner_login, owner_id, name, full_name, language, forks_count, stargazers_count, watchers_count, subscribers_count, size, has_issues, has_wiki, has_pages, has_downloads, pushed_at, created_at, updated_at,
      owner_login, owner_id, name, full_name, language, forks_count, stargazers_count, watchers_count, subscribers_count, size, has_issues, has_wiki, has_pages, has_downloads, pushed_at, created_at, updated_at
    ]);
    const params = {
      _computationId: id,
      _computationOwner: payload._computationOwner,
      _computationRepo: payload._computationRepo
    };
    yield call(newComputationSideEffect, connection, env, {
      ...params,
      _computationAction: GET_LAST
    }); // get last
    yield put(endComputation(payload));
  } catch (error) {
    yield put(endComputation(action.payload, error));
  }
}

export function* getReposSideEffect(action) {
  try {
    const {
      connection,
      env
    } = yield select(stateSelector);
    const {
      payload
    } = action;
    const repos = yield call(axios, `${env.GITHUB_API}/repositories?since=${payload._computationSince}`);
    let i = 0;
    if (repos && repos.data) {
      const useableRepos = repos.data.filter(r => !r.fork)
      for (; i < useableRepos.length; i++) {
        if (!useableRepos[i].name || !useableRepos[i].owner || !useableRepos[i].owner.login) {
          continue;
        }
        yield call(newComputationSideEffect, connection, env, {
          _computationAction: GET_REPO,
          _computationOwner: useableRepos[i].owner.login,
          _computationRepo: useableRepos[i].name
        }); // repo data
      }
      const next = /<(.|\n)*?>/g.exec(repos.headers['Link'].split(',').filter(x => x.indexOf('rel="next"') !== -1)[0])[0].replace('<', '').replace('>', '');
      const since = parseInt(urlparse(next).query.substring(1).split('&').filter(x => x.indexOf('since=') !== -1)[0].split('=')[1]);
      const updatedCount = parseInt(payload._computationReposCount || 0) + useableRepos.length;
      if (updatedCount < parseInt(env.MAX_REPOS)) {
        yield call(newComputationSideEffect, connection, env, {
          _computationAction: GET_REPOS,
          _computationSince: since,
          _computationReposCount: updatedCount
        }); // run next
      }
    }
    yield put(endComputation(payload));
  } catch (error) {
    yield put(endComputation(action.payload, error));
  }
}

export function* getLastSideEffect(action) {
  try {
    const {
      connection,
      env
    } = yield select(stateSelector);
    const {
      payload
    } = action;
    const commit = yield call(axios, `https://api.github.com/repos/${payload._computationOwner}/${payload._computationRepo}/commits`);
    const last = /<(.|\n)*?>/g.exec(commit.headers['Link'].split(',').filter(x => x.indexOf('rel="last"') !== -1)[0])[0].replace('<', '').replace('>', '');
    const page = parseInt(urlparse(last).query.substring(1).split('&').filter(x => x.indexOf('page=') !== -1)[0].split('=')[1]);
    yield call(newComputationSideEffect, connection, env, {
      _computationAction: GET_COMMITS,
      _computationPage: page,
      _computationCommitCount: 0,
      _computationId: payload._computationId,
      _computationOwner: payload._computationOwner,
      _computationRepo: payload._computationRepo
    }); // get commits
    yield put(endComputation(payload));
  } catch (error) {
    yield put(endComputation(action.payload, error));
  }
}

export function* getCommitsSideEffect(action) {
  try {
    const {
      connection,
      env
    } = yield select(stateSelector);
    const {
      payload
    } = action;
    const commits = yield call(axios, `https://api.github.com/repositories/${payload._computationId}/commits?page=${payload._computationPage}`);
    if (commits && commits.data && commits.data.length) {
      let i = 0;
      for (; i < commits.data.length; i++) {
        if (commits.data[i].sha) {
          yield call(newComputationSideEffect, connection, env, {
            _computationAction: GET_COMMIT,
            _computationId: payload._computationId,
            _computationSHA: commits.data[i].sha,
            _computationOwner: payload._computationOwner,
            _computationRepo: payload._computationRepo
          }); // commit data;
        }
      }
      const updatedCount = parseInt(payload._computationCommitCount || 0) + commits.data.length;
      if (payload._computationPage > 1 && updatedCount < parseInt(env.MAX_COMMITS)) {
        yield call(newComputationSideEffect, connection, env, {
          _computationAction: GET_COMMITS,
          _computationPage: payload._computationPage - 1,
          _computationCommitCount: updatedCount,
          _computationId: payload._computationId,
          _computationOwner: payload._computationOwner,
          _computationRepo: payload._computationRepo
        }); // get commits again
      }
    }
    yield put(endComputation(payload));
  } catch (error) {
    yield put(endComputation(action.payload, error));
  }
}

export function* getCommitSideEffect(action) {
  try {
    const {
      connection,
      env
    } = yield select(stateSelector);
    const {
      payload
    } = action;
    const commit = yield call(axios, `${env.GITHUB_API}/repos/${payload._computationOwner}/${payload._computationRepo}/commits/${payload._computationSHA}`);
    const sha = commit && commit.data ? commit.data.sha : null;
    if (sha === null) {
      return; // cannot insert into the DB without an sha
    }
    const repo_id = parseInt(payload._computationId);
    const author_name = commit && commit.data && commit.data.commit && commit.data.commit.author ? commit.data.commit.author.name : null;
    const author_email = commit && commit.data && commit.data.commit && commit.data.commit.author ? commit.data.commit.author.email : null;
    const author_date = commit && commit.data && commit.data.commit && commit.data.commit.author ? commit.data.commit.author.date : null;
    const committer_name = commit && commit.data && commit.data.commit && commit.data.commit.committer ? commit.data.commit.committer.name : null;
    const committer_email = commit && commit.data && commit.data.commit && commit.data.commit.committer ? commit.data.commit.committer.email : null;
    const committer_date = commit && commit.data && commit.data.commit && commit.data.commit.committer ? commit.data.commit.committer.date : null;
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
    yield put(endComputation(payload));
  } catch (error) {
    yield put(endComputation(action.payload, error));
  }
}

export const destroy = connection => connection.destroy();

export const deleteLambda = payload => new Promise((resolve, reject) => new AWS.Lambda().deleteFunction({
  FunctionName: payload._computationFunctionName
}, (e, r) => e ? reject(e) : resolve(r)));

export function* endComputationSideEffect(action) {
  const {
    payload,
    error
  } = action;
  const {
    connection,
    env
  } = yield select(stateSelector);
  // decrease the concurrent computation
  let outstanding = [];
  try {
    yield call(beginTransaction, connection);
  } catch(e) {
    throw e;
  }
  try {
    yield call(sqlPromise, connection, DECREASE_CONNECTION_COUNT_STATEMENT, ['connections']); // decrease count
    const count = yield call(sqlPromise, connection, SELECT_CONNECTIONS_STMT, ['connections']); // get count
    outstanding = yield call(sqlPromise, connection, SELECT_DEFFERED_STMT, [parseInt(env.MAX_LAMBDAS) - parseInt(count[0].connections)]); // get this many jobs
    if (outstanding.length) {
      yield call(sqlPromise, connection, `DELETE FROM deferred WHERE ${outstanding.map(o => 'id = ?').join(' OR ')};`, outstanding.map(o => o.id)); // delete those jobs
    }
    yield call(commitTransaction, connection);
  } catch (e) {
    yield call(rollbackTransaction, connection);
  }
  if (outstanding.length > 0) {
    let i = 0;
    for (; i < outstanding.length; i++) {
      yield call(newComputationSideEffect, connection, env, JSON.parse(outstanding[i].json)); // invoke outstanding jobs
    }
  }
  // destroy the connection
  yield call(destroy, connection);
  // delete the computation
  yield call(deleteLambda, payload);
}

function* githubSaga() {
  takeEvery(GET_LAST, getLastSideEffect);
  takeEvery(GET_COMMIT, getCommitSideEffect);
  takeEvery(GET_COMMITS, getCommitsSideEffect);
  takeEvery(GET_REPO, getRepoSideEffect);
  takeEvery(GET_REPOS, getReposSideEffect);
  takeEvery(END_COMPUTATION, endComputationSideEffect);
}

export default githubSaga;
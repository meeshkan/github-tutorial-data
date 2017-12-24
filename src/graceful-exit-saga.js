import {
  END_SCRIPT,
  SPAWN_SERVER_SUCCESS,
  END_SCRIPT_FAILURE,
} from './actions';

import uuidv4 from 'uuid/v4';

import {
  SELECT_UNFULFILLED_STMT,
  INCREASE_EXECUTING_STATEMENT,
  SELECT_EXECUTING_STATEMENT,
  DECREASE_EXECUTING_STATEMENT
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
  destroy
} from './util';

import AWS from 'aws-sdk';

export const stateSelector = $ => $;

export const createFunction = (params, env) => new Promise((resolve, reject) => new AWS.EC2({
  region: env.GITHUB_TUTORIAL_AWS_REGION
}).requestSpotInstances(params, (e, r) => e ? reject(e) : resolve(r)));

export const getFunctionsToLaunch = (unfulfilled, executing, maxComputations) => {
  if (unfulfilled === 0) {
    return 0;
  }
  return 1 + (Math.random() > executing / maxComputations ? 1 : 0);
}

export function* endScriptSideEffect() {
  const {
    connection,
    env
  } = yield select(stateSelector);
  try {
    // the bloc below is laborious but necessary to keep the number of servers down
    // otherwise, we could get into the situation where we spawn too many servers
    // basically, if we have unfulfilled jobs, then we taper off the number of launched servers once we get to half max capacity
    // this will result in a bit of waste in the end but it is easier than other types of bookkeeping
    const _unfulfilled = yield call(sqlPromise, connection, SELECT_UNFULFILLED_STMT, []); // get how many unfulfilled functions there are
    const unfulfilled = _unfulfilled.length > 0 ? parseInt(_unfulfilled[0].unfulfilled || 0) : 0;
    const _executing = yield call(sqlPromise, connection, SELECT_EXECUTING_STATEMENT, []); // how many jobs are executing
    const executing = parseInt(_executing[0].executing);
    yield call(sqlPromise, connection, DECREASE_EXECUTING_STATEMENT, [env.GITHUB_TUTORIAL_UNIQUE_ID]); // we decrease the number of executing jobs
    const maxComputations = parseInt(env.MAX_COMPUTATIONS || 0);
    const functionsToLaunch = yield call(getFunctionsToLaunch, unfulfilled, executing, maxComputations);
    // we don't need the connection anymore, so we release it to the pool
    let i = 0;
    for (; i < functionsToLaunch; i++) {
      const uniqueId = yield call(uuidv4);
      const USER_DATA = `#!/bin/bash
export GITHUB_TUTORIAL_UNIQUE_ID="${uniqueId}" && \
export WRITE_DEBUG_LOGS_TO_DB="${env.WRITE_DEBUG_LOGS_TO_DB}" && \
export MY_SQL_HOST="${env.MY_SQL_HOST}" && \
export MY_SQL_PORT="${env.MY_SQL_PORT}" && \
export MY_SQL_USERNAME="${env.MY_SQL_USERNAME}" && \
export MY_SQL_PASSWORD="${env.MY_SQL_PASSWORD}" && \
export MY_SQL_DATABASE="${env.MY_SQL_DATABASE}" && \
export MY_SQL_SSL="${env.MY_SQL_SSL}" && \
export GITHUB_API="${env.GITHUB_API}" && \
export MAX_REPOS="${env.MAX_REPOS}" && \
export MAX_COMMITS="${env.MAX_COMMITS}" && \
export MONITOR_FUNCTION="${env.MONITOR_FUNCTION}" && \
export MAX_COMPUTATIONS="${env.MAX_COMPUTATIONS}" && \
export PACKAGE_URL="${env.PACKAGE_URL}" && \
export PACKAGE_NAME="${env.PACKAGE_NAME}" && \
export PACKAGE_FOLDER="${env.PACKAGE_FOLDER}" && \
export GITHUB_TUTORIAL_AWS_REGION="${env.GITHUB_TUTORIAL_AWS_REGION}" && \
export GITHUB_TUTORIAL_SPOT_PRICE="${env.GITHUB_TUTORIAL_SPOT_PRICE}" && \
export GITHUB_TUTORIAL_DRY_RUN="${env.GITHUB_TUTORIAL_DRY_RUN}" && \
export GITHUB_TUTORIAL_SUBNET_ID="${env.GITHUB_TUTORIAL_SUBNET_ID}" && \
export GITHUB_TUTORIAL_SECURITY_GROUP_ID="${env.GITHUB_TUTORIAL_SECURITY_GROUP_ID}" && \
export GITHUB_TUTORIAL_IAM_INSTANCE_ARN="${env.GITHUB_TUTORIAL_IAM_INSTANCE_ARN}" && \
export GITHUB_TUTORIAL_IMAGE_ID="${env.GITHUB_TUTORIAL_IMAGE_ID}" && \
export GITHUB_TUTORIAL_KEY_NAME="${env.GITHUB_TUTORIAL_KEY_NAME}" && \
cd ~ && \
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash && \
export NVM_DIR="$HOME/.nvm" && \
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && \
nvm install 6.11.5 && \
mkdir $PACKAGE_FOLDER && \
cd $PACKAGE_FOLDER && \
wget $PACKAGE_URL && \
unzip $PACKAGE_NAME && \
node index.js
sudo shutdown -h now
`;
      const createFunctionParams = {
        InstanceCount: 1,
        DryRun: JSON.parse(env.GITHUB_TUTORIAL_DRY_RUN || 'false'),
        InstanceInterruptionBehavior: 'terminate',
        LaunchSpecification: {
          InstanceType: 't2.micro',
          SubnetId: env.GITHUB_TUTORIAL_SUBNET_ID,
          ...(env.GITHUB_TUTORIAL_KEY_NAME ? {
            KeyName: env.GITHUB_TUTORIAL_KEY_NAME
          } : {}),
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
        SpotPrice: env.GITHUB_TUTORIAL_SPOT_PRICE,
        Type: "one-time"
      };
      try {
        yield call(createFunction, createFunctionParams, env);
      } catch (e) {
        if (e.code !== 'DryRunOperation') {
          throw e;
        }
      }
      yield call(sqlPromise, connection, INCREASE_EXECUTING_STATEMENT, [uniqueId]);
      yield put({
        type: SPAWN_SERVER_SUCCESS,
        payload: uniqueId
      });
      // this blocks the loop but the slow-down is negligible as we will only ever be spawning
      // a small number of servers. we want to log it as soon as it happens.
      yield take(`${uniqueId}_LOGGED`);
    }
  } catch (e) {
    console.error(e);
    const uuid = yield call(uuidv4);
    yield put({
      type: END_SCRIPT_FAILURE,
      meta: {
        uuid
      },
      error: e
    });
    yield take(`${uuid}_LOGGED`);
  } finally {
    yield call(destroy, connection);
    // this is where the process should exit
    // if it doesn't it means that there is a bug somewhere in the code
    // we do not force an exit so that if some connection stays open somewhere,
    // we can inspect the process logs and see what is blocking the exit
  }
}

function* gracefulExitSaga() {
  yield takeEvery(END_SCRIPT, endScriptSideEffect);
}

export default gracefulExitSaga;
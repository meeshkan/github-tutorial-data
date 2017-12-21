[![Build Status](https://travis-ci.org/Meeshkan/github-tutorial-data.svg?branch=master)](https://travis-ci.org/Meeshkan/github-tutorial-data)

# Github Tutorial

This is the part of the Meeshkan Github totrial that populates the database with data from the Github public API.

If you've landed here, you are most likely following our tutorial video and/or our Medium blog.  If not, make sure to consult those to get your AWS account up and running.

Running the code is easy: just boot up an Amazon AMI of Amazon Linux and copy and paste the script below to the command line of your Amazon Linux EC2 instance once you have SSHed into it.  This script uses real Amazon values from the tutorial video, but replace them with values from your environment.   The shutdown bit is optional.

Before running this script:
1. Make sure you have set up a VPC and have configured subnets, security groups, route tables and internet gateways correctly.
2. Make sure you have set up a RDS Aurora instance.
3. Make sure you have set up a an IAM role for your EC2 instances.
4. Make sure to set up a Lambda function to signal where we stop.
5. You can upload the tutorial as a package wherever, but if you want to upload it to AWS S3, then make sure the object is publically accessible.  To package this code, run `npm run package` from the root directory of this repository.
6. Make sure that you use a sensible EC2 AMI, like the most recent Amazon Linux.
```
export GITHUB_TUTORIAL_UNIQUE_ID="initial-bootstrap-instance" && \
export SCRIPT_EPOCH="0" && \
export RAVEN_URL="https://af79396d23404563826f7c84f5389d4f:17e487bb9b02427dabfa4de5fb37e381@sentry.io/260958" && \
export MY_SQL_HOST="github-cluster.cluster-c35szb4rgmky.us-east-1.rds.amazonaws.com" && \
export MY_SQL_PORT="3306" && \
export MY_SQL_USERNAME="octocat" && \
export MY_SQL_PASSWORD="feedmesomerepos" && \
export MY_SQL_DATABASE="github" && \
export MY_SQL_SSL="Amazon RDS" && \
export GITHUB_API="https://api.github.com" && \
export START_REPO="1234567" && \
export MAX_REPOS="600000" && \
export MAX_COMMITS="100" && \
export MONITOR_FUNCTION="ShouldStopDataCollection" && \
export MAX_COMPUTATIONS="950" && \
export PACKAGE_URL="https://s3.amazonaws.com/meeshkan-github-tutorial/github-tutorial-data.zip" && \
export PACKAGE_NAME="github-tutorial-data.zip" && \
export PACKAGE_FOLDER="github-tutorial-data" && \
export GITHUB_API_LIMIT="60" && \
export GITHUB_TUTORIAL_DRY_RUN="false" && \
export GITHUB_TUTORIAL_SUBNET_ID="subnet-e255eacd" && \
export GITHUB_TUTORIAL_SECURITY_GROUP_ID="sg-64d0dd11" && \
export GITHUB_TUTORIAL_IAM_INSTANCE_ARN="arn:aws:iam::089316269059:instance-profile/github-ec2-role" && \
export GITHUB_TUTORIAL_IMAGE_ID="ami-55ef662f" && \
export GITHUB_TUTORIAL_KEY_NAME="github-tutorial" && \
export IS_INITIAL="true" && \
cd ~ && \
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash && \
export NVM_DIR="$HOME/.nvm" && \
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && \
. ~/.nvm/nvm.sh && \
nvm install 6.11.5 && \
mkdir $PACKAGE_FOLDER && \
cd $PACKAGE_FOLDER && \
wget $PACKAGE_URL && \
unzip $PACKAGE_NAME && \
node index.js
sudo shutdown -h now
```

### [Meeshkan](https://hackernoon.com/@meeshkan)

// config file used for testing local data files
// config and data files to test must exist in the store dir

const devEnv = process.env.REACT_APP_NODE_ENV ? process.env.REACT_APP_NODE_ENV === 'development' : process.env.NODE_ENV === 'development';

const s3BucketUrl = process.env.REACT_APP_S3_BUCKET_URL 
    ? process.env.REACT_APP_S3_BUCKET_URL 
    : (devEnv 
        ? 'https://idd-dashboard-runs-staging.s3.amazonaws.com/json-files/' 
        : 'json-files/');
const localDir = process.env.REACT_APP_LOCAL_DIR;

module.exports = {
    s3BucketUrl,
    localDir,
};

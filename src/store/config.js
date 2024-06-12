// config file used for testing local data files
// config and data files to test must exist in the store dir

// s3 bucket location of 3147 county geoid jsons
const s3BucketUrl = process.env.NODE_ENV === 'development' ?
            'https://idd-dashboard-runs-staging.s3.amazonaws.com/json-files/'
            : 'json-files/'; // key prefix of relative bucket 

// set file type to test to use_local = true and add update file_name value
const USE_LOCAL_GEOID = false;
const LOCAL_GEOID = ''; // '06085.json'

const USE_LOCAL_ACTUALS = false;
const LOCAL_ACTUALS = ''; // '06085_actuals.json'

// static files
const CONFIGS = {
    'outcomes': {
        'use_local': false,
        'file_name': '' // 'outcomes.json'
    },
    'statsForMap': {
        'use_local': false,
        'file_name': '' // 'statsForMap.json'
    },
    'countyBoundaries': {
        'use_local': false,
        'file_name': '' // 'countyBoundaries.json'
    }
};

module.exports = {
    s3BucketUrl,
    USE_LOCAL_GEOID,
    LOCAL_GEOID,
    USE_LOCAL_ACTUALS,
    LOCAL_ACTUALS,
    CONFIGS
};

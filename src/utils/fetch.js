import { s3BucketUrl, localDir } from '../store/config';

export async function fetchJSON(type, geoid) {
    // First determine the filename to get
    let filename = `${type}.json`;
    if (type === 'dataset' || type === 'actuals') {
        if (!geoid) {
            console.error(`The type given was '${type}', but geoid is '${geoid}'. No data will be found.`);
        }
        if (type === 'dataset') {
            filename = `${geoid}.json`;
        } else {
            filename = `${geoid}_actuals.json`;
        }
    }
    // Next figure out where we're getting it from
    let url = '';
    if (localDir) {
        let dir = localDir.charAt(localDir.length - 1) !== '/' ? `${localDir}/` : localDir;
        dir = dir.charAt(0) !== '/' ? `/${dir}` : dir;
        url = `${dir}${filename}`;
        console.log(`Acquiring type '${type}' and geoid '${geoid}' from '${url}'.`);
        // return require(`${dir}${filename}`);
    } else {
        url = s3BucketUrl.charAt(s3BucketUrl.length - 1) !== '/' ? `${s3BucketUrl}/` : s3BucketUrl;
        url = `${url}${filename}`;
        console.log(`Acquiring type '${type}' and geoid '${geoid}' from '${url}'.`);
    }
    let response = await fetch(`${url}`);
    if (!response.ok) {
        throw new Error(`HTTP error for retrieving file type '${type}' for geoid '${geoid}'. Status: ${response.status}.`)
    }
    return await response.json();
}

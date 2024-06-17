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
    if (localDir) {
        const dir = localDir.charAt(localDir.length - 1) !== '/' ? `${localDir}/` : localDir;
        console.log(`Acquiring type '${type}' and geoid '${geoid}' from '${dir}${filename}'.`)
        return require(`${dir}${filename}`);
    }
    const url = s3BucketUrl.charAt(s3BucketUrl.length - 1) !== '/' ? `${s3BucketUrl}/` : s3BucketUrl;
    console.log(`Acquiring type '${type}' and geoid '${geoid}' from '${url}${filename}'.`)
    let response = await fetch(`${url}${filename}`);
    if (!response.ok) {
        throw new Error(`HTTP error for retrieving file type '${type}' for geoid '${geoid}'. Status: ${response.status}.`)
    }
    return await response.json();
}

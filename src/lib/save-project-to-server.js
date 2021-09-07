import queryString from 'query-string';
import xhr from 'xhr';
import storage from '../lib/storage';

/**
 * Save a project JSON to the project server.
 * This should eventually live in scratch-www.
 * @param {number} projectId the ID of the project, null if a new project.
 * @param {object} vmState the JSON project representation.
 * @param {object} params the request params.
 * @property {?number} params.originalId the original project ID if a copy/remix.
 * @property {?boolean} params.isCopy a flag indicating if this save is creating a copy.
 * @property {?boolean} params.isRemix a flag indicating if this save is creating a remix.
 * @property {?string} params.title the title of the project.
 * @return {Promise} A promise that resolves when the network request resolves.
 */
export default function (projectId, vmState, params) {
    const opts = {
        body: vmState,
        // If we set json:true then the body is double-stringified, so don't
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true
    };
    const creatingProject = projectId === null || typeof projectId === 'undefined';
    const queryParams = {};
    if (params.hasOwnProperty('originalId')) queryParams.original_id = params.originalId;
    if (params.hasOwnProperty('isCopy')) queryParams.is_copy = params.isCopy;
    if (params.hasOwnProperty('isRemix')) queryParams.is_remix = params.isRemix;
    if (params.hasOwnProperty('title')) queryParams.title = params.title;
    if (params.hasOwnProperty('ppid')) queryParams.ppid = params.ppid;
    if (params.hasOwnProperty('teacherid')) queryParams.teacherid = params.teacherid;
    if (params.hasOwnProperty('authorid')) queryParams.authorid = params.authorid;
    let qs = queryString.stringify(queryParams);
    if (qs) qs = `${qs}`;

    //const creatingProject = projectId === 0;
    if (projectId == 0) {//新建作品

        console.log("----------qs是:"+ storage.projectHost +"/"+ projectId + qs);

        Object.assign(opts, {
            method: 'post',
            url: `/api/scratch/insertOrUpdate?${qs}`
        });
    } else {//已有作品，更新作品JSON源代码
        
        Object.assign(opts, {
            method: 'post',
            url: `/api/scratch/insertOrUpdate?id=${projectId}&${qs}`
        });
    }

    return new Promise((resolve, reject) => {
        xhr(opts, (err, response) => {
            if (err) return reject(err);
            if (response.statusCode !== 200) return reject(response.statusCode);

            let body;
            try {
                // Since we didn't set json: true, we have to parse manually
                body = JSON.parse(response.body);
            } catch (e) {
                return reject(e);
            }

            if (projectId != 0) {
                body.id = projectId;
            }

            resolve(body);
        });
    });

/*
    if (creatingProject) {
        Object.assign(opts, {
            method: 'post',
            url: `${storage.projectHost}/${qs}`
        });
    } else {
        Object.assign(opts, {
            method: 'put',
            url: `${storage.projectHost}/${projectId}${qs}`
        });
    }
    return new Promise((resolve, reject) => {
        xhr(opts, (err, response) => {
            if (err) return reject(err);
            if (response.statusCode !== 200) return reject(response.statusCode);
            let body;
            try {
                // Since we didn't set json: true, we have to parse manually
                body = JSON.parse(response.body);
            } catch (e) {
                return reject(e);
            }
            body.id = projectId;
            if (creatingProject) {
                body.id = body['content-name'];
            }
            resolve(body);
        });
    });
    */
}

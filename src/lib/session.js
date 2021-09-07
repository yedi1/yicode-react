function miniFetch(resolve, reject, uri, params){
    var opts = {
        headers:{
            'Accept':'application/json,text/plain,*/*',/* 格式限制：json、文本、其他格式 */
            'Content-Type':'application/json'/* 请求内容类型 */
        },
        method:'post'
    }
    if (params){
        if (params.headers) {opts['headers'] =  Object.assign(opts['headers'], params.headers)}
        if (params.method) {opts["method"] = params.method}
        if (params.body)   {opts["body"] = params.body}
    }

    fetch(uri, opts)
    .then(response=>{
        var body = response.json();
        if(response.status == 200){
            return resolve(body);
        }
        return reject(body)
    })
    .catch(err=>reject(err))
};

//获取项目源代码
module.exports.requestProject = (resolve, reject, projectId) => (
    miniFetch(resolve, reject, `/api/scratch/detail/${projectId}`)
);
//保存标题
module.exports.requestSaveProjectTitle = (resolve, reject, projectId, projectTitle) => {
    // ${proje
    miniFetch(resolve, reject, '/api/scratch/saveProjectTitle', {body:JSON.stringify({"id":projectId,"title":projectTitle})})
};
//保存缩略图
module.exports.requestSaveProjectThumbnail = (resolve, reject, projectId, thumbnailBlob) => {
    miniFetch(resolve, reject, `/api/scratch/thumbnail/${projectId}`, {body:thumbnailBlob})
};


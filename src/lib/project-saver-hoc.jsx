import bindAll from 'lodash.bindall';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import VM from 'scratch-vm';

import collectMetadata from '../lib/collect-metadata';
import log from '../lib/log';
import storage from '../lib/storage';
import dataURItoBlob from '../lib/data-uri-to-blob';
import saveProjectToServer from '../lib/save-project-to-server';

import {
    showAlertWithTimeout,
    showStandardAlert
} from '../reducers/alerts';
import {setAutoSaveTimeoutId} from '../reducers/timeout';
import {setProjectUnchanged} from '../reducers/project-changed';
import {
    LoadingStates,
    autoUpdateProject,
    createProject,
    doneCreatingProject,
    doneUpdatingProject,
    getIsAnyCreatingNewState,
    getIsCreatingCopy,
    getIsCreatingNew,
    getIsLoading,
    getIsManualUpdating,
    getIsRemixing,
    getIsShowingWithId,
    getIsShowingWithoutId,
    getIsUpdating,
    projectError,

    setProjectNewId,//设置作品新ID

} from '../reducers/project-state';
import {requestSaveProjectThumbnail} from './session';
/**
 * Higher Order Component to provide behavior for saving projects.
 * @param {React.Component} WrappedComponent the component to add project saving functionality to
 * @returns {React.Component} WrappedComponent with project saving functionality added
 *
 * <ProjectSaverHOC>
 *     <WrappedComponent />
 * </ProjectSaverHOC>
 */
const ProjectSaverHOC = function (WrappedComponent) {
    class ProjectSaverComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'getProjectThumbnail',
                'leavePageConfirm',
                'tryToAutoSave'
            ]);
        }
        componentWillMount () {
            if (typeof window === 'object') {
                // Note: it might be better to use a listener instead of assigning onbeforeunload;
                // but then it'd be hard to turn this listening off in our tests
                window.onbeforeunload = e => this.leavePageConfirm(e);
            }

            // Allow the GUI consumer to pass in a function to receive a trigger
            // for triggering thumbnail or whole project saves.
            // These functions are called with null on unmount to prevent stale references.
            this.props.onSetProjectThumbnailer(this.getProjectThumbnail);
            this.props.onSetProjectSaver(this.tryToAutoSave);
            
        }
        componentDidUpdate (prevProps) {
            if (!this.props.isAnyCreatingNewState && prevProps.isAnyCreatingNewState) {
                this.reportTelemetryEvent('projectWasCreated');
            }
            if (!this.props.isLoading && prevProps.isLoading) {
                this.reportTelemetryEvent('projectDidLoad');
            }

            if (this.props.projectChanged && !prevProps.projectChanged) {
                //this.scheduleAutoSave();
            }
            if (this.props.isUpdating && !prevProps.isUpdating) {
                this.updateProjectToStorage();
            }

            if (this.props.isCreatingNew && !prevProps.isCreatingNew) {
                this.createNewProjectToStorage();
            }
            if (this.props.isCreatingCopy && !prevProps.isCreatingCopy) {
                this.createCopyToStorage();
            }
            if (this.props.isRemixing && !prevProps.isRemixing) {
                this.props.onRemixing(true);
                this.createRemixToStorage();
            } else if (!this.props.isRemixing && prevProps.isRemixing) {
                this.props.onRemixing(false);
            }

            // see if we should "create" the current project on the server
            //
            // don't try to create or save immediately after trying to create
            if (prevProps.isCreatingNew) return;
            // if we're newly able to create this project, create it!
            if (this.isShowingCreatable(this.props) && !this.isShowingCreatable(prevProps)) {
                this.props.onCreateProject();
            }

            // see if we should save/update the current project on the server
            //
            // don't try to save immediately after trying to save
            if (prevProps.isUpdating) return;
            // if we're newly able to save this project, save it!
            const becameAbleToSave = this.props.canSave && !prevProps.canSave;
            const becameShared = this.props.isShared && !prevProps.isShared;
            if (this.props.isShowingSaveable && (becameAbleToSave || becameShared)) {
                this.props.onAutoUpdateProject();
            }
        }
        componentWillUnmount () {
            this.clearAutoSaveTimeout();
            // Cant unset the beforeunload because it might no longer belong to this component
            // i.e. if another of this component has been mounted before this one gets unmounted
            // which happens when going from project to editor view.
            // window.onbeforeunload = undefined; // eslint-disable-line no-undefined
            // Remove project thumbnailer function since the components are unmounting
            this.props.onSetProjectThumbnailer(null);
            this.props.onSetProjectSaver(null);
        }
        leavePageConfirm (e) {
            if (this.props.projectChanged) {
                // both methods of returning a value may be necessary for browser compatibility
                (e || window.event).returnValue = true;
                return true;
            }
            return; // Returning undefined prevents the prompt from coming up
        }
        clearAutoSaveTimeout () {
            if (this.props.autoSaveTimeoutId !== null) {
                clearTimeout(this.props.autoSaveTimeoutId);
                this.props.setAutoSaveTimeoutId(null);
            }
        }
        scheduleAutoSave () {
            if (this.props.isShowingSaveable && this.props.autoSaveTimeoutId === null) {
                const timeoutId = setTimeout(this.tryToAutoSave,
                    this.props.autoSaveIntervalSecs * 1000);
                this.props.setAutoSaveTimeoutId(timeoutId);
            }
        }
        tryToAutoSave () {
            if (this.props.projectChanged && this.props.isShowingSaveable) {
                this.props.onAutoUpdateProject();
            }
        }
        isShowingCreatable (props) {
            return props.canCreateNew && props.isShowingWithoutId;
        }
        updateProjectToStorage () {
            console.log("开始上传作品到服务器："+this.props.reduxProjectId);
            console.log("reduxProjectPid开始上传作品到服务器："+this.props.reduxProjectPid);


            this.props.onShowSavingAlert();
            return this.storeProject(this.props.reduxProjectId)
                .then(() => {
                    // there's an http response object available here, but we don't need to examine
                    // it, because there are no values contained in it that we care about
                    this.props.onUpdatedProject(this.props.loadingState);
                    this.props.onShowSaveSuccessAlert();
                })
                .catch(err => {
                    // Always show the savingError alert because it gives the
                    // user the chance to download or retry the save manually.
                    this.props.onShowAlert('savingError');
                    this.props.onProjectError(err);
                });
        }
        createNewProjectToStorage () {
            return this.storeProject(null)
                .then(response => {
                    this.props.onCreatedProject(response.id.toString(), this.props.loadingState);
                })
                .catch(err => {
                    this.props.onShowAlert('creatingError');
                    this.props.onProjectError(err);
                });
        }
        createCopyToStorage () {
            this.props.onShowCreatingCopyAlert();
            return this.storeProject(null, {
                originalId: this.props.reduxProjectId,
                isCopy: 1,
                title: this.props.reduxProjectTitle
            })
                .then(response => {
                    this.props.onCreatedProject(response.id.toString(), this.props.loadingState);
                    this.props.onShowCopySuccessAlert();
                })
                .catch(err => {
                    this.props.onShowAlert('creatingError');
                    this.props.onProjectError(err);
                });
        }
        createRemixToStorage () {
            this.props.onShowCreatingRemixAlert();
            return this.storeProject(null, {
                originalId: this.props.reduxProjectId,
                isRemix: 1,
                title: this.props.reduxProjectTitle
            })
                .then(response => {
                    this.props.onCreatedProject(response.id.toString(), this.props.loadingState);
                    this.props.onShowRemixSuccessAlert();
                })
                .catch(err => {
                    this.props.onShowAlert('creatingError');
                    this.props.onProjectError(err);
                });
        }
        /**
         * storeProject:
         * @param  {number|string|undefined} projectId - defined value will PUT/update; undefined/null will POST/create
         * @return {Promise} - resolves with json object containing project's existing or new id
         * @param {?object} requestParams - object of params to add to request body
         */
        storeProject (projectId, requestParams) {
            requestParams = requestParams || {};

            const ppId = window.location.search.match(/pid=(\d+)/);
            if(ppId){
                storage.ppId = ppId[1];
                storage.reduxProjectPid = ppId[1];
                console.log("666666666666666666--------------storage.ppId:"+storage.ppId +"   storage.reduxProjectPid:" + storage.reduxProjectPid);
            }
        //保存,修改的时候需要带上作者的id
        requestParams['teacherid']=localStorage.getItem('userName');
        requestParams['authorid']=ppId;
        requestParams['title']=this.props.reduxProjectTitle;
            // if (projectId!=0){//新作品，同时上传作品名称
            //     console.log("现在保存的是新作品："+this.props.reduxProjectTitle)
            //     console.log("reduxProjectPid现在保存的是新作品："+this.props.reduxProjectPid);           
            //     console.log("requestParams['title']："+ requestParams['title'] +"requestParams['ppid']: " + requestParams['ppid'])
            // }

            this.clearAutoSaveTimeout();
            // Serialize VM state now before embarking on
            // the asynchronous journey of storing assets to
            // the server. This ensures that assets don't update
            // while in the process of saving a project (e.g. the
            // serialized project refers to a newer asset than what
            // we just finished saving).
            const savedVMState = this.props.vm.toJSON();
            return Promise.all(this.props.vm.assets
                .filter(asset => !asset.clean)
                .map(
                    asset => storage.store(
                        asset.assetType,
                        asset.dataFormat,
                        asset.data,
                        asset.assetId
                    ).then(response => {
                        // Asset servers respond with {status: ok} for successful POSTs
                        if (response.status !== 'ok') {
                            // Errors include a `code` property, e.g. "Forbidden"
                            return Promise.reject(response.code);
                        }
                        asset.clean = true;
                    })
                )
            )
                .then(() => this.props.onUpdateProjectData(projectId, savedVMState, requestParams))
                .then(response => {
                    if (response.id){//返回的作品ID
                        //保存缩略图
                        this.storeProjectThumbnail(response.id);

                        
                        //如果是第一次保存作品
                        if (projectId==0){
                            console.log('返回的作品ID：'+response.id)
                            //第一步：设置作品新Id、作者Id
                            this.props.onSetProjectNewId(response.id);
                            //第二步：设置浏览器的uri
                            window.location.hash=response.id;
                        }
                    }
                    
                    this.props.onSetProjectUnchanged();//设置作品为未修改状态
                    //this.reportTelemetryEvent('projectDidSave');
                    return response;

                    /*
                    this.props.onSetProjectUnchanged();
                    const id = response.id.toString();
                    if (id && this.props.onUpdateProjectThumbnail) {
                        this.storeProjectThumbnail(id);
                    }
                    this.reportTelemetryEvent('projectDidSave');
                    return response;
                    */
                })
                .catch(err => {
                    log.error(err);
                    throw err; // pass the error up the chain
                });
        }


                /**
         * Store a snapshot of the project once it has been saved/created.
         * Needs to happen _after_ save because the project must have an ID.
         * @param {!string} projectId - id of the project, must be defined.
         */
        //保存缩略图新函数
        storeProjectThumbnail (projectId) {
            try {
                //从VM中获取缩略图
                this.props.vm.postIOData('video', {forceTransparentPreview: true});
                this.props.vm.renderer.requestSnapshot(dataURI => {
                    this.props.vm.postIOData('video', {forceTransparentPreview: false});
                    //保存缩略图
                    new Promise((resolve, reject) => requestSaveProjectThumbnail(resolve, reject, projectId, dataURI))
                    .then(
                        body => {},
                        err => log.error(err)
                        //body => console.log('缩略图保存成功：'+projectId),
                        //err =>  {console.error('作品缩略图保存失败：'+projectId);console.error(err)}
                    );
                });
                this.props.vm.renderer.draw();
            } catch (e) {
                //不抛出异常，毕竟保存缩略图对用户来说，不是非常重要
                log.error('作品缩略图保存异常：'+projectId, e);
            }
        }
        /**
         * Store a snapshot of the project once it has been saved/created.
         * Needs to happen _after_ save because the project must have an ID.
         * @param {!string} projectId - id of the project, must be defined.
         */
        /*
        storeProjectThumbnail (projectId) {
            try {
                this.getProjectThumbnail(dataURI => {
                    this.props.onUpdateProjectThumbnail(projectId, dataURItoBlob(dataURI));
                });
            } catch (e) {
                log.error('Project thumbnail save error', e);
                // This is intentionally fire/forget because a failure
                // to save the thumbnail is not vitally important to the user.
            }
        }
*/
        getProjectThumbnail (callback) {
            this.props.vm.postIOData('video', {forceTransparentPreview: true});
            this.props.vm.renderer.requestSnapshot(dataURI => {
                this.props.vm.postIOData('video', {forceTransparentPreview: false});
                callback(dataURI);
            });
            this.props.vm.renderer.draw();
        }

        /**
         * Report a telemetry event.
         * @param {string} event - one of `projectWasCreated`, `projectDidLoad`, `projectDidSave`, `projectWasUploaded`
         */
        // TODO make a telemetry HOC and move this stuff there
        reportTelemetryEvent (event) {
            try {
                if (this.props.onProjectTelemetryEvent) {
                    const metadata = collectMetadata(this.props.vm, this.props.reduxProjectTitle, this.props.locale);
                    this.props.onProjectTelemetryEvent(event, metadata);
                }
            } catch (e) {
                log.error('Telemetry error', event, e);
                // This is intentionally fire/forget because a failure
                // to report telemetry should not block saving
            }
        }

        render () {
            const {
                /* eslint-disable no-unused-vars */
                onSetProjectNewId,

                autoSaveTimeoutId,
                autoSaveIntervalSecs,
                isCreatingCopy,
                isCreatingNew,
                projectChanged,
                isAnyCreatingNewState,
                isLoading,
                isManualUpdating,
                isRemixing,
                isShowingSaveable,
                isShowingWithId,
                isShowingWithoutId,
                isUpdating,
                loadingState,
                onAutoUpdateProject,
                onCreatedProject,
                onCreateProject,
                onProjectError,
                onRemixing,
                onSetProjectUnchanged,
                onSetProjectThumbnailer,
                onSetProjectSaver,
                onShowAlert,
                onShowCopySuccessAlert,
                onShowRemixSuccessAlert,
                onShowCreatingCopyAlert,
                onShowCreatingRemixAlert,
                onShowSaveSuccessAlert,
                onShowSavingAlert,
                onUpdatedProject,
                onUpdateProjectData,
                onUpdateProjectThumbnail,
                reduxProjectId,
                reduxProjectTitle,
                setAutoSaveTimeoutId: setAutoSaveTimeoutIdProp,
                reduxProjectPid,
                /* eslint-enable no-unused-vars */
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    isCreating={isAnyCreatingNewState}
                    {...componentProps}
                />
            );
        }
    }

    ProjectSaverComponent.propTypes = {
        onSetProjectNewId: PropTypes.func,

        autoSaveIntervalSecs: PropTypes.number.isRequired,
        autoSaveTimeoutId: PropTypes.number,
        canCreateNew: PropTypes.bool,
        canSave: PropTypes.bool,
        isAnyCreatingNewState: PropTypes.bool,
        isCreatingCopy: PropTypes.bool,
        isCreatingNew: PropTypes.bool,
        isLoading: PropTypes.bool,
        isManualUpdating: PropTypes.bool,
        isRemixing: PropTypes.bool,
        isShared: PropTypes.bool,
        isShowingSaveable: PropTypes.bool,
        isShowingWithId: PropTypes.bool,
        isShowingWithoutId: PropTypes.bool,
        isUpdating: PropTypes.bool,
        loadingState: PropTypes.oneOf(LoadingStates),
        locale: PropTypes.string.isRequired,
        onAutoUpdateProject: PropTypes.func,
        onCreateProject: PropTypes.func,
        onCreatedProject: PropTypes.func,
        onProjectError: PropTypes.func,
        onProjectTelemetryEvent: PropTypes.func,
        onRemixing: PropTypes.func,
        onSetProjectSaver: PropTypes.func.isRequired,
        onSetProjectThumbnailer: PropTypes.func.isRequired,
        onSetProjectUnchanged: PropTypes.func.isRequired,
        onShowAlert: PropTypes.func,
        onShowCopySuccessAlert: PropTypes.func,
        onShowCreatingCopyAlert: PropTypes.func,
        onShowCreatingRemixAlert: PropTypes.func,
        onShowRemixSuccessAlert: PropTypes.func,
        onShowSaveSuccessAlert: PropTypes.func,
        onShowSavingAlert: PropTypes.func,
        onUpdateProjectData: PropTypes.func.isRequired,
        onUpdateProjectThumbnail: PropTypes.func,
        onUpdatedProject: PropTypes.func,
        projectChanged: PropTypes.bool,
        reduxProjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        reduxProjectPid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        reduxProjectTitle: PropTypes.string,
        setAutoSaveTimeoutId: PropTypes.func.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired
    };
    ProjectSaverComponent.defaultProps = {
        autoSaveIntervalSecs: 120,
        onRemixing: () => {},
        onSetProjectThumbnailer: () => {},
        onSetProjectSaver: () => {},
        onUpdateProjectData: saveProjectToServer
    };
    const mapStateToProps = (state, ownProps) => {
        const loadingState = state.scratchGui.projectState.loadingState;
        const isShowingWithId = getIsShowingWithId(loadingState);
        return {
            autoSaveTimeoutId: state.scratchGui.timeout.autoSaveTimeoutId,
            isAnyCreatingNewState: getIsAnyCreatingNewState(loadingState),
            isLoading: getIsLoading(loadingState),
            isCreatingCopy: getIsCreatingCopy(loadingState),
            isCreatingNew: getIsCreatingNew(loadingState),
            isRemixing: getIsRemixing(loadingState),
            isShowingSaveable: ownProps.canSave && isShowingWithId,
            isShowingWithId: isShowingWithId,
            isShowingWithoutId: getIsShowingWithoutId(loadingState),
            isUpdating: getIsUpdating(loadingState),
            isManualUpdating: getIsManualUpdating(loadingState),
            loadingState: loadingState,
            locale: state.locales.locale,
            projectChanged: state.scratchGui.projectChanged,
            reduxProjectId: state.scratchGui.projectState.projectId,
            reduxProjectPid: state.scratchGui.projectState.ppid,//reduxProjectPid: state.scratchGui.projectState.ppid,
            reduxProjectTitle: state.scratchGui.projectTitle,
            vm: state.scratchGui.vm
        };
    };
    const mapDispatchToProps = dispatch => ({
        onSetProjectNewId: (projectId) => dispatch(setProjectNewId(projectId)),

        onAutoUpdateProject: () => dispatch(autoUpdateProject()),
        onCreatedProject: (projectId, loadingState) => dispatch(doneCreatingProject(projectId, loadingState)),
        onCreateProject: () => dispatch(createProject()),
        onProjectError: error => dispatch(projectError(error)),
        onSetProjectUnchanged: () => dispatch(setProjectUnchanged()),
        onShowAlert: alertType => dispatch(showStandardAlert(alertType)),
        onShowCopySuccessAlert: () => showAlertWithTimeout(dispatch, 'createCopySuccess'),
        onShowRemixSuccessAlert: () => showAlertWithTimeout(dispatch, 'createRemixSuccess'),
        onShowCreatingCopyAlert: () => showAlertWithTimeout(dispatch, 'creatingCopy'),
        onShowCreatingRemixAlert: () => showAlertWithTimeout(dispatch, 'creatingRemix'),
        onShowSaveSuccessAlert: () => showAlertWithTimeout(dispatch, 'saveSuccess'),
        onShowSavingAlert: () => showAlertWithTimeout(dispatch, 'saving'),
        onUpdatedProject: loadingState => dispatch(doneUpdatingProject(loadingState)),
        setAutoSaveTimeoutId: id => dispatch(setAutoSaveTimeoutId(id))
    });
    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );
    return connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(ProjectSaverComponent);
};

export {
    ProjectSaverHOC as default
};

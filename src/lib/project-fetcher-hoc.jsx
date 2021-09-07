import React from 'react';
import PropTypes from 'prop-types';
import {intlShape, injectIntl} from 'react-intl';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';

import {setProjectUnchanged} from '../reducers/project-changed';
import {
    LoadingStates,
    getIsCreatingNew,
    getIsFetchingWithId,
    getIsLoading,
    getIsShowingProject,
    onFetchedProjectData,
    projectError,
    setProjectId,
    setProjectTitle,

    setProjectPid,
    //setProjectData,
} from '../reducers/project-state';
import {
    activateTab,
    BLOCKS_TAB_INDEX
} from '../reducers/editor-tab';

import log from './log';
import storage from './storage';
const {requestProject} = require('./session');//向服务器请求作品的源代码
/* Higher Order Component to provide behavior for loading projects by id. If
 * there's no id, the default project is loaded.
 * @param {React.Component} WrappedComponent component to receive projectData prop
 * @returns {React.Component} component with project loading behavior
 */
const ProjectFetcherHOC = function (WrappedComponent) {
    class ProjectFetcherComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'fetchProject'
            ]);
            storage.setProjectHost(props.projectHost);
            storage.setAssetHost(props.assetHost);
            storage.setTranslatorFunction(props.intl.formatMessage);
            // props.projectId might be unset, in which case we use our default;
            // or it may be set by an even higher HOC, and passed to us.
            // Either way, we now know what the initial projectId should be, so
            // set it in the redux store.
            if (
                props.projectId !== '' &&
                props.projectId !== null &&
                typeof props.projectId !== 'undefined'
            ) {
                this.props.setProjectId(props.projectId.toString());
            }

            const ppId = window.location.search.match(/pid=(\d+)/);
            if(ppId){

                storage.ppId = ppId[1];
                storage.reduxProjectPid = ppId[1];
                console.log("111111search.match&------------------"+ ppId[1] +"   "+storage.ppId +"------storage.reduxProjectPid------------------"+storage.reduxProjectPid);
 
            }

            
        }
        componentDidUpdate (prevProps) {

            console.log("storage.ppId:111111-------------:"+storage.ppId);

            if (prevProps.projectHost !== this.props.projectHost) {
                storage.setProjectHost(this.props.projectHost);
            }
            if (prevProps.assetHost !== this.props.assetHost) {
                storage.setAssetHost(this.props.assetHost);
            }
            if (this.props.isFetchingWithId && !prevProps.isFetchingWithId) {
                if (parseInt(this.props.reduxProjectId)==0){//加载默认作品
                    this.fetchProject(this.props.reduxProjectId, this.props.loadingState);

                // console.log("7777:" + this.props.reduxProjectId +"8888:" + this.props.loadingState);
                    return;
                }

                //加载服务器作品
                console.log("开始加载作品数据:"+this.props.reduxProjectId);
                new Promise((resolve, reject) => requestProject(resolve, reject, this.props.reduxProjectId))
                .then(body => {//服务器以JSON返回项目数据时的接口：
                    if (body.status=='ok'){
                        //console.log(body.src.src)//从服务器获取到的作品源代码
                        //console.log("当前作品状态："+this.props.loadingState)
                        this.props.onFetchedProjectData(body.src.src, this.props.loadingState);

                        this.props.onSetProjectTitle(body.src.title)
                        //this.props.onSetProjectData(body.src);
                    } else {
                        this.props.onError('');
                        
                        console.warn(body.status);//如果出错了，看看就是什么错误
                        //新建一个作品
                        //改变hash，在hash-parser-hoc.jsx中有监听此事件，即可新建作品
                        window.location.hash='B';//随意写一个字符，使hash产生变化，才能触发监听事件
                        //去除url中hash的空#字符
                        history.pushState('B', 'B',window.location.pathname + window.location.search);
                    }
                })
                .catch(err => {
                    this.props.onError(err);
                });

            }
            if (this.props.isShowingProject && !prevProps.isShowingProject) {
                this.props.onProjectUnchanged();
            }
            if (this.props.isShowingProject && (prevProps.isLoadingProject || prevProps.isCreatingNew)) {
                this.props.onActivateTab(BLOCKS_TAB_INDEX);
            }
        }
        fetchProject (projectId, loadingState) {
            return storage
                .load(storage.AssetType.Project, projectId, storage.DataFormat.JSON)
                .then(projectAsset => {
                    if (projectAsset) {
                        this.props.onFetchedProjectData(projectAsset.data, loadingState);
                    } else {
                        // Treat failure to load as an error
                        // Throw to be caught by catch later on
                        throw new Error('Could not find project');
                    }
                })
                .catch(err => {
                    this.props.onError(err);
                    log.error(err);
                });
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                onSetProjectTitle,

                assetHost,
                intl,
                isLoadingProject: isLoadingProjectProp,
                loadingState,
                onActivateTab,
                onError: onErrorProp,
                onFetchedProjectData: onFetchedProjectDataProp,
                onProjectUnchanged,
                projectHost,
                projectId,
                reduxProjectId,
                setProjectId: setProjectIdProp,
                reduxProjectPid,
                /* eslint-enable no-unused-vars */
                isFetchingWithId: isFetchingWithIdProp,
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    fetchingProject={isFetchingWithIdProp}
                    {...componentProps}
                />
            );
        }
    }
    ProjectFetcherComponent.propTypes = {
        assetHost: PropTypes.string,
        canSave: PropTypes.bool,
        intl: intlShape.isRequired,
        isCreatingNew: PropTypes.bool,
        isFetchingWithId: PropTypes.bool,
        isLoadingProject: PropTypes.bool,
        isShowingProject: PropTypes.bool,
        loadingState: PropTypes.oneOf(LoadingStates),
        onActivateTab: PropTypes.func,
        onError: PropTypes.func,
        onFetchedProjectData: PropTypes.func,
        onProjectUnchanged: PropTypes.func,
        projectHost: PropTypes.string,
        projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        reduxProjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        reduxProjectPid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        setProjectId: PropTypes.func,
        onSetProjectTitle: PropTypes.func
    };
    ProjectFetcherComponent.defaultProps = {
        //assetHost: 'https://assets.scratch.mit.edu',
        //projectHost: 'https://projects.scratch.mit.edu'
        assetHost: '/api/scratch/assets',
        projectHost: '/api/scratch/projects'
    };

    const mapStateToProps = state => ({
        isCreatingNew: getIsCreatingNew(state.scratchGui.projectState.loadingState),
        isFetchingWithId: getIsFetchingWithId(state.scratchGui.projectState.loadingState),
        isLoadingProject: getIsLoading(state.scratchGui.projectState.loadingState),
        isShowingProject: getIsShowingProject(state.scratchGui.projectState.loadingState),
        loadingState: state.scratchGui.projectState.loadingState,
        reduxProjectId: state.scratchGui.projectState.projectId,
        reduxProjectPid: state.scratchGui.projectState.ppId
    });
    const mapDispatchToProps = dispatch => ({
        //onSetProjectData: (projectData) => dispatch(setProjectData(projectData)),
        onSetProjectTitle: title => dispatch(setProjectTitle(title)),
        onActivateTab: tab => dispatch(activateTab(tab)),
        onError: error => dispatch(projectError(error)),
        onFetchedProjectData: (projectData, loadingState) =>
            dispatch(onFetchedProjectData(projectData, loadingState)),
        setProjectId: projectId => dispatch(setProjectId(projectId)),
        onProjectUnchanged: () => dispatch(setProjectUnchanged())
    });
    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );
    return injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(ProjectFetcherComponent));
};

export {
    ProjectFetcherHOC as default
};

import classNames from 'classnames';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, intlShape, injectIntl} from 'react-intl';
import {setProjectTitle} from '../../reducers/project-title';

import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';
import Input from '../forms/input.jsx';
const BufferedInput = BufferedInputHOC(Input);

import styles from './project-title-input.css';

const messages = defineMessages({
    projectTitlePlaceholder: {
        id: 'gui.gui.projectTitlePlaceholder',
        description: 'Placeholder for project title when blank',
        defaultMessage: 'Project title here'
    }
});

const ProjectTitleInput = ({
    className,
    intl,
    canEdit,
    onSubmit,
    projectTitle
}) => (
    <BufferedInput
        className={classNames(styles.titleField, className)}
        maxLength="100"
        placeholder={intl.formatMessage(messages.projectTitlePlaceholder)}
        tabIndex="0"
        type="text"
        disabled={!canEdit}
        value={projectTitle}
        onSubmit={onSubmit}
    />
);

ProjectTitleInput.propTypes = {
    className: PropTypes.string,
    intl: intlShape.isRequired,
    //onSubmit: PropTypes.func,
    projectTitle: PropTypes.string
};

const mapStateToProps = state => ({
    //projectTitle: state.scratchGui.projectTitle
    projectTitle: state.scratchGui.projectState.title
});

const mapDispatchToProps = dispatch => ({
    //用上层传递过来的onSubmit替代此函数
    //onSubmit: title => dispatch(setProjectTitle(title))
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(ProjectTitleInput));

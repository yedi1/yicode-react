import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';
import { openLoginModal } from '../../reducers/modals.js';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';


import styles from './login-button.css';


import {connect} from 'react-redux';


const LoginButton = ({
    className,
    onOpen,
}) => (
    <Button
        className={classNames(
            className,
            styles.loginButton
        )}
        onClick={onOpen}
    >
        <FormattedMessage
            defaultMessage="登录"
            description="Label for login"
            id="gui.menuBar.login"
        />
    </Button>
);
    

LoginButton.propTypes = {
    className: PropTypes.string,
    onOpen: PropTypes.func.isRequired
};

const mapDispatchToProps = dispatch => ({
    onOpen: () => dispatch(openLoginModal())
});

export default connect(
    mapDispatchToProps
)(LoginButton);
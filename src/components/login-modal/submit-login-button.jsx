import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';
import styles from './login-modal.css';
const SubmitLoginButton = ({
    className,
    onClick
}) => (
    <div>
        <Button
            className={classNames(
                className,
                styles.SubmitLoginButton
            )}
            onClick={onClick}
        >
            <FormattedMessage
                defaultMessage="登录"
                description="Label for submit login"
                id="gui.loginModal.submitLogin"
            />
        </Button>
    </div>
);
SubmitLoginButton.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func
};
SubmitLoginButton.defaultProps = {
    onClick: () => {}
};
export default SubmitLoginButton;
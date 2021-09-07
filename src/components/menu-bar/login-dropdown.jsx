/* eslint-disable react/jsx-no-bind */
/*
NOTE: this file only temporarily resides in scratch-gui.
Nearly identical code appears in scratch-www, and the two should
eventually be consolidated.
*/

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import axios from 'axios';
import {defineMessages} from 'react-intl';

import MenuBarMenu from './menu-bar-menu.jsx';

import styles from './login-dropdown.scss';

// these are here as a hack to get them translated, so that equivalent messages will be translated
// when passed in from www via gui's renderLogin() function
const LoginDropdownMessages = defineMessages({ // eslint-disable-line no-unused-vars
    username: {
        defaultMessage: 'Username',
        description: 'Label for login username input',
        id: 'general.username'
    },
    password: {
        defaultMessage: 'Password',
        description: 'Label for login password input',
        id: 'general.password'
    },
    signin: {
        defaultMessage: 'Sign in',
        description: 'Button text for user to sign in',
        id: 'general.signIn'
    },
    needhelp: {
        defaultMessage: 'Need Help?',
        description: 'Button text for user to indicate that they need help',
        id: 'login.needHelp'
    },
    validationRequired: {
        defaultMessage: 'This field is required',
        description: 'Message to tell user they must enter text in a form field',
        id: 'form.validationRequired'
    }
});


class LoginDropdown extends React.Component{
    constructor (props) {
        super(props);
        this.state = {
            loginName: '',
            password: '',
            imgCode: '',
            img: '',
            imgKey: ''
        };
    }

    async componentDidMount () {
        this.getImgKey();
    }

    async getImgKey (){
        const res = await axios.get('http://www.tiaotiaoshu.com/api/user/getImgCode');
        if (res.data.success){
            const {imgKey, img} = res.data.data;

            this.setState({imgKey, img});
        }
    }

    async getSession (){
        const {password, loginName, imgKey, imgCode} = this.state;
        const res = await axios.post('http://www.tiaotiaoshu.com/api/user/login', {
            password,
            loginName,
            imgKey,
            imgCode
        });
        if (res.data.success){
            // const {imgKey, img} = res.data.data;
            this.props.onLogin(res.data.data);
            this.getUserInfo(res.data.data.token);
            //
            // this.setState({imgKey, img});
        } else {
            // eslint-disable-next-line no-alert
            alert(res.data.msg);
        }
    }
    async getUserInfo (token){
        axios.defaults.headers.token = token;
        const res = await axios.post('http://www.tiaotiaoshu.com/api/user/info', {headers: {token}});
        if (res.data.success){
            // const {imgKey, img} = res.data.data;
            this.props.onLogin(res.data.data);
            //
            // this.setState({imgKey, img});
        } else {
            // eslint-disable-next-line no-alert
            alert(res.data.msg);
        }
    }

    render () {
        const {className, isOpen, onClose, isRtl} = this.props;
        return (
            <MenuBarMenu
                className={className}
                open={isOpen}
                // note: the Rtl styles are switched here, because this menu is justified
                // opposite all the others
                place={isRtl ? 'right' : 'left'}
                onRequestClose={onClose}
            >
                <div
                    className={classNames(
                        styles.login
                    )}
                >
                    <div className="login_login">
                        <input
                            type="text"
                            required=""
                            placeholder="账号"
                            value={this.state.loginName}
                            maxLength="16"
                            onChange={e => {
                                this.setState({loginName: e.target.value});
                            }}
                        />

                        <input
                            type="password"
                            required=""
                            value={this.state.password}
                            placeholder="密码"
                            maxLength="16"
                            onChange={e => {
                                this.setState({password: e.target.value});
                            }}
                        />
                        <div className={styles.flex}>
                            <input
                                className={styles.imgCode}
                                type="text"
                                value={this.state.imgCode}
                                placeholder="图形验证码"
                                onChange={e => {
                                    this.setState({imgCode: e.target.value});
                                }}
                            />
                            <img
                                className={styles.flex.img}
                                src={this.state.img}
                                alt=""
                            />
                            <span
                                onClick={() => {
                                    this.getImgKey();
                                }}
                            >{'换一换'}</span>

                        </div>
                        <div
                            className={classNames(
                                styles['login_submit-row']
                            )}
                        >
                            <button
                                onClick={() => {
                                    this.getSession();
                                }}
                                className={classNames(
                                    styles['submit-button']
                                )}
                            >{'登 录'}</button>
                            <a
                                href="http://www.tiaotiaoshu.com/user/login.html"
                                rel="noreferrer"
                                target="_blank"
                            >{'注 册'}</a>
                        </div>
                    </div>
                </div>
            </MenuBarMenu>
        );
    }
}

LoginDropdown.propTypes = {
    className: PropTypes.string,
    isOpen: PropTypes.bool,
    isRtl: PropTypes.bool,
    onClose: PropTypes.func,
    onLogin: PropTypes.func
    // renderLogin: PropTypes.func
};

export default LoginDropdown;

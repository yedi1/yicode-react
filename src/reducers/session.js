const SET_SESSION = 'scratch-gui/session/SET_SESSION';
import _ from 'lodash';
const initialState = {
    // eslint-disable-next-line max-len
    session: {session: {user: localStorage.user ? JSON.parse(localStorage.user)?.session?.session?.user : {}}, permissions: ''}
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_SESSION:
        // eslint-disable-next-line no-case-declarations
        const data = _.merge({}, state, {
            session: {
                session: {
                    user: action.session
                }}
        });
        localStorage.removeItem('user');
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('userName', action.session?.userName || '');
        localStorage.setItem('token', data?.session?.session?.user?.token || '');
        return data;
    default:
        return state;
    }
};

const setSession = function (session) {
    return {
        type: SET_SESSION,
        session: session
    };
};


export {
    reducer as default,
    initialState as sessionInitialState,
    setSession
};

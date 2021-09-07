import keyMirror from 'keymirror';


const UserState = keyMirror({
    NOT_LOGINED: null,
    LOGINED: null
});

const UserStates = Object.keys(UserState);
const initialState = {
    error: null,
    userData: null,
    loginState: UserState.NOT_LOGINED
};

const getIsLogined = loginState => (
    loginState === UserState.LOGINED
);


const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case UserStates:
        return {loginState: action.loginState};
    default: return state;
    }
};


export {
    reducer as default,
    initialState as userStateInitialState,
    UserState,
    UserStates,
    getIsLogined
};

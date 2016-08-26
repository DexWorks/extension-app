'use strict';

import {combineReducers} from 'redux';
import editors from './editors';
import sessions from './sessions';
import remoteView from './remote-view';
import tabs from './tabs';

const keyReducer = combineReducers({
    editors,
    sessions,
    remoteView,
    tabs: noop,
    client: noop,
    options: noop
});

export default function(state, action) {
    state = keyReducer(state, action);
    return tabs(state, action);
};

function noop(state={}) {
    return state;
}

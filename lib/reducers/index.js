'use strict';

import {combineReducers} from 'redux';
import editors from './editors';
import sessions from './sessions';
import tabs from './tabs';

const keyReducer = combineReducers({editors, sessions, tabs: noop});

export default function(state, action) {
    state = keyReducer(state, action);
    return tabs(state, action);
};

function noop(state={}) {
    return state;
}

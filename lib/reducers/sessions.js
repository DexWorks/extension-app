/**
 * Redux reducers for `pages` key
 */
'use strict';
import {SESSION} from '../action-names';
import {has, get, copy} from '../utils';
import {set, remove} from '../immutable';

export default function(state=new Map(), action) {
    switch (action.type) {
        case SESSION.TOGGLE_ENABLED:
            return toggleEnabled(state, action);
        case SESSION.UPDATE_FILE_MAPPING:
            return updateFileMapping(state, action);
        case SESSION.UPDATE_DIRECTION:
            return updateDirection(state, action);
        case SESSION.LAST_USED:
            return updateLastUsed(state, action);
        case SESSION.ADD_USER_STYLESHEET:
            return addUserStylesheet(state, action);
        case SESSION.REMOVE_USER_STYLESHEET:
            return removeUserStylesheet(state, action);
    }

    return state;
};

function toggleEnabled(state, action) {
    if (!has(state, action.id)) {
        return set(state, action.id, {
            enabled: true,
            direction: SESSION.DIRECTION_BOTH,
            lastUsed: Date.now(),
            userMapping: new Map(),
            userStylesheets: new Set()
        });
    }

    var session = get(state, action.id);
    return set(state, action.id, set(session, 'enabled', !session.enabled));
}

function updateFileMapping(state, action) {
    var session = get(state, action.id);
    if (session && get(session.userMapping, action.browser) !== action.editor) {
        var userMapping = set(session.userMapping, action.browser, action.editor);
        state = set(state, action.id, set(session, 'userMapping', userMapping));
    }

    return state;
}

function updateDirection(state, action) {
    var session = get(state, action.id);
    if (session && session.direction !== action.direction) {
        state = set(state, action.id, set(session, 'direction', action.direction));
    }

    return state;
}

function updateLastUsed(state, action) {
    var session = get(state, action.id);
    if (session) {
        state = set(state, action.id, set(session, 'lastUsed', Date.now()));
    }
    return state;
}

function addUserStylesheet(state, action) {
    if (!action.stylesheet) {
        throw new Error('No `stylesheet` key in action');
    }

    var session = get(state, action.id);
    if (session) {
        let userStylesheets = copy(session.userStylesheets).add(action.stylesheet);
        state = set(state, action.id, set(session, 'userStylesheets', userStylesheets));
    }

    return state;
}

function removeUserStylesheet(state, action) {
    var session = get(state, action.id);
    if (session && has(session.userStylesheets, action.stylesheet)) {
        let userStylesheets = remove(session.userStylesheets, action.stylesheet);
        state = set(state, action.id, set(session, 'userStylesheets', userStylesheets));
    }

    return state;
}

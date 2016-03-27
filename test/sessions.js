/**
 * Test `sessions` key reducer
 */
'use strict';

const assert = require('assert');
const redux = require('redux');
require('babel-register');
const reducer = require('../lib/reducers/sessions').default;
const SESSION = require('../lib/action-names').SESSION;

describe('Sessions reducer', () => {
    var store, dispatch;

    beforeEach(() => {
        store = redux.createStore(reducer, new Map());
        dispatch = action => store.dispatch(action);
    });

    afterEach(() => {
        store = dispatch = null;
    });

    it('toggle session activity', () => {
        var id = 'sample-session';

        dispatch({type: SESSION.TOGGLE_ENABLED, id});
        var state = store.getState();
        assert.equal(state.get(id).enabled, true);

        dispatch({type: SESSION.TOGGLE_ENABLED, id});
        state = store.getState();
        assert.equal(state.get(id).enabled, false);
    });

    it('update mapping', () => {
        var id = 'sample-session';
        var browser = 'browser.css';
        var editor = 'editor1.less';
        var state;

        // create session first
        dispatch({type: SESSION.TOGGLE_ENABLED, id});

        dispatch({type: SESSION.UPDATE_FILE_MAPPING, id, browser, editor});
        state = store.getState();
        assert.equal(state.get(id).userMapping.get(browser), editor);

        // do not update object if mapping not changed
        var prevMapping = state.get(id).userMapping;
        dispatch({type: SESSION.UPDATE_FILE_MAPPING, id, browser, editor});
        state = store.getState();
        assert.equal(state.get(id).userMapping, prevMapping);

        // update existing mapping
        dispatch({type: SESSION.UPDATE_FILE_MAPPING, id, browser, editor: 'bar.scss'});
        state = store.getState();
        assert.equal(state.get(id).userMapping.get(browser), 'bar.scss');
    });

    it('update direction', () => {
        var id = 'sample-session';

        // create session first
        dispatch({type: SESSION.TOGGLE_ENABLED, id});

        var prevState = store.getState();

        dispatch({type: SESSION.UPDATE_DIRECTION, id, direction: SESSION.DIRECTION_TO_EDITOR});
        var state = store.getState();
        assert.equal(state.get(id).direction, SESSION.DIRECTION_TO_EDITOR);
        assert(state !== prevState);

        // do not update state if direction is the same
        prevState = state;
        dispatch({type: SESSION.UPDATE_DIRECTION, id, direction: SESSION.DIRECTION_TO_EDITOR});
        state = store.getState();
        assert.equal(state.get(id).direction, SESSION.DIRECTION_TO_EDITOR);
        assert(state === prevState);
    });

    it('manage stylesheets', () => {
        var id = 'sample-session';

        // create session first
        dispatch({type: SESSION.TOGGLE_ENABLED, id});

        dispatch({type: SESSION.ADD_USER_STYLESHEET, id});
        var state = store.getState();
        assert.equal(state.get(id).userStylesheets.size, 1);
        var stylesheet = Array.from(state.get(id).userStylesheets)[0];
        assert(/^css\d+$/.test(stylesheet));

        dispatch({type: SESSION.ADD_USER_STYLESHEET, id});
        state = store.getState();
        assert.equal(state.get(id).userStylesheets.size, 2);

        dispatch({type: SESSION.REMOVE_USER_STYLESHEET, id, stylesheet});
        state = store.getState();
        assert.equal(state.get(id).userStylesheets.size, 1);
    });
});

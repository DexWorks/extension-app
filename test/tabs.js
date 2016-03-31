/**
 * Test `tabs` key reducer
 */
'use strict';

const assert = require('assert');
const redux = require('redux');
require('babel-register');
const reducer = require('../lib/reducers').default;
const TAB = require('../lib/action-names').TAB;
const EDITOR = require('../lib/action-names').EDITOR;

describe('Tabs reducer', () => {
    var store, dispatch;
    var tabId = 'tab1';
    var tab = {
        origin: 'http://localhost',
        url: 'http://localhost/test.html'
    };

    beforeEach(() => {
        store = redux.createStore(reducer, {
            tabs: new Map(),
            editors: {
                list: new Map(),
                files: new Set([
                    'dir/style.css',
                    'dir/module.less'
                ])
            },
            sessions: new Map()
            .set('http://localhost/index.html', {
                enabled: true,
                direction: 'both',
                userMapping: new Map(),
                userStylesheets: new Set()
            })
            .set('http://localhost/test.html', {
                enabled: true,
                direction: 'to editor',
                userMapping: new Map(),
                userStylesheets: new Set()
            })
        });
        dispatch = action => store.dispatch(action);
    });

    afterEach(() => {
        store = dispatch = null;
    });

    it('add tab', () => {
        dispatch({
            type: TAB.UPDATE_LIST,
            tabs: {[tabId]: tab}
        });

        var tabs = store.getState().tabs;
        var tabItem = tabs.get(tabId);
        assert(tabItem);
        // should map session
        assert.equal(tabItem.session.id, 'http://localhost/test.html');
    });

    it('update & map stylesheets', () => {
        dispatch({
            type: TAB.UPDATE_LIST,
            tabs: {[tabId]: tab}
        });

        var prevState = store.getState();

        // add stylesheet into default zone
        dispatch({
            type: TAB.SET_STYLESHEET_DATA,
            id: tabId,
            items: ['http://localhost/style.css']
        });

        dispatch({
            type: TAB.SET_STYLESHEET_DATA,
            id: tabId,
            items: new Set(['http://localhost/module.css']),
            zone: 'cssom'
        });

        dispatch({
            type: TAB.SET_STYLESHEET_DATA,
            id: tabId,
            items: new Map().set('http://localhost/bar.css', 'body {}'),
            zone: 'devtools'
        });

        var state = store.getState();
        assert(prevState !== state);
        assert(prevState.sessions === state.sessions);
        assert(prevState.tabs !== state.tabs);

        var tabItem = store.getState().tabs.get(tabId);

        // collect stylesheets from all zones
        assert.deepEqual(Array.from(tabItem.session.stylesheets),
            ['http://localhost/style.css', 'http://localhost/module.css', 'http://localhost/bar.css']);

        // auto map browser files with editor ones
        assert.equal(tabItem.session.mapping.get('http://localhost/style.css'), 'dir/style.css');
        assert.equal(tabItem.session.mapping.get('http://localhost/module.css'), 'dir/module.less');
    });

    it('re-map files on editors change', () => {
        dispatch({
            type: TAB.UPDATE_LIST,
            tabs: {[tabId]: tab}
        });

        dispatch({
            type: TAB.SET_STYLESHEET_DATA,
            id: tabId,
            items: ['http://localhost/bar.css']
        });

        var tabItem = store.getState().tabs.get(tabId);
        assert.equal(tabItem.session.mapping.get('http://localhost/bar.css'), undefined);

        dispatch({
            type: EDITOR.CONNECT,
            editor: {
                id: 'sample-editor',
                name: 'Sample Editor',
                files: ['project/bar.scss']
            }
        });

        tabItem = store.getState().tabs.get(tabId);
        assert.equal(tabItem.session.mapping.get('http://localhost/bar.css'), 'project/bar.scss');
    });
});
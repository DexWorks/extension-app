/**
 * Test `tabs` key reducer
 */
'use strict';

const assert = require('assert');
const redux = require('redux');
require('babel-register');
const reducer = require('../lib/reducers').default;
const actionNames = require('../lib/action-names');
const TAB = actionNames.TAB;
const EDITOR = actionNames.EDITOR;
const SESSION = actionNames.SESSION;

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

    it('update stylesheet item', () => {
        dispatch({
            type: TAB.UPDATE_LIST,
            tabs: {[tabId]: tab}
        });

        dispatch({
            type: TAB.SET_STYLESHEET_DATA,
            id: tabId,
            items: new Map()
            .set('foo', 'bar')
            .set('foo2', 'bar2')
        });

        var ss = store.getState().tabs.get(tabId).stylesheets['default'];
        assert.equal(ss.size, 2);
        assert.equal(ss.get('foo'), 'bar');
        assert.equal(ss.get('foo2'), 'bar2');

        dispatch({
            type: TAB.UPDATE_STYLESHEET_ITEM,
            id: tabId,
            itemId: 'foo',
            itemValue: 'baz'
        });

        ss = store.getState().tabs.get(tabId).stylesheets['default'];
        assert.equal(ss.size, 2);
        assert.equal(ss.get('foo'), 'baz');
        assert.equal(ss.get('foo2'), 'bar2');
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

    it('re-map files on manual mapping update', () => {
        dispatch({
            type: TAB.UPDATE_LIST,
            tabs: {[tabId]: tab}
        });

        dispatch({
            type: TAB.SET_STYLESHEET_DATA,
            id: tabId,
            items: ['http://localhost/style.css']
        });

        var tabItem = store.getState().tabs.get(tabId);
        assert.equal(tabItem.session.mapping.get('http://localhost/style.css'), 'dir/style.css');

        dispatch({
            type: SESSION.UPDATE_FILE_MAPPING,
            id: tab.url,
            browser: 'http://localhost/style.css',
            editor: 'dir/module.less'
        });

        tabItem = store.getState().tabs.get(tabId);
        assert.equal(tabItem.session.mapping.get('http://localhost/style.css'), 'dir/module.less');

        // map to non-existing stylesheet: should fall back to auto mapping
        dispatch({
            type: SESSION.UPDATE_FILE_MAPPING,
            id: tab.url,
            browser: 'http://localhost/style.css',
            editor: 'foo/bar.scss'
        });

        tabItem = store.getState().tabs.get(tabId);
        assert.equal(tabItem.session.mapping.get('http://localhost/style.css'), 'dir/style.css');
    });

    it('update tab list', () => {
        dispatch({
            type: TAB.UPDATE_LIST,
            tabs: new Map()
            .set(1, {
                origin: 'http://localhost',
                url: 'http://localhost/test.html'
            })
            .set(2, {
                origin: 'http://localhost:9000',
                url: 'http://localhost:9000/test.html'
            })
        });

        var tabs = store.getState().tabs;
        assert.equal(tabs.size, 2);
        assert.equal(tabs.get(1).origin, 'http://localhost');
        assert.equal(tabs.get(1).session.id, 'http://localhost/test.html');
        assert.equal(tabs.get(2).origin, 'http://localhost:9000');
        assert.equal(tabs.get(2).session, null);

        var tab1 = tabs.get(1);

        dispatch({
            type: TAB.UPDATE_LIST,
            tabs: new Map()
            .set(1, {
                origin: 'http://localhost',
                url: 'http://localhost/test.html'
            })
            .set(3, {
                origin: 'http://localhost:9001',
                url: 'http://localhost:9001/test.html'
            })
        });

        tabs = store.getState().tabs;
        assert.equal(tabs.size, 2);
        // Tab object for id 1 should be the same
        assert.equal(tabs.get(1), tab1);
        assert.equal(tabs.get(1).origin, 'http://localhost');
        assert.equal(tabs.get(1).session.id, 'http://localhost/test.html');
        assert.equal(tabs.get(2), undefined);
        assert.equal(tabs.get(3).origin, 'http://localhost:9001');
        assert.equal(tabs.get(3).session, null);
    });

    it('patches', () => {
        function parse(props) {
            return (props || '').split(';').filter(Boolean).map(item => {
                var parts = item.split(':');
                return {
                    name: parts[0].trim(),
                    value: parts[1].trim()
                };
            });
        };

        function patch(updated, removed, path) {
            var parts = (path || 'div|1').split('|');
            return {
                path: [[parts[0].trim(), parts[1] || 1]],
                action: 'update',
                update: parse(updated),
                remove: parse(removed)
            }
        };

        // create tab first
        dispatch({
            type: TAB.UPDATE_LIST,
            tabs: {[tabId]: tab}
        });

        // save resource patches for given stylesheet in tab session
        dispatch({
            type: TAB.SAVE_PATCHES,
            id: tabId,
            uri: 'http://localhost/style.css',
            patches: [patch('position:relative')]
        });

        var tabItem = store.getState().tabs.get(tabId);
        var patches = tabItem.session.patches.get('http://localhost/style.css');
        assert.equal(patches.length, 1);
        assert.deepEqual(patches[0].update, [{name: 'position', value: 'relative'}]);

        // add more patches
        dispatch({
            type: TAB.SAVE_PATCHES,
            id: tabId,
            uri: 'http://localhost/style.css',
            patches: [patch('position:absolute')]
        });
        dispatch({
            type: TAB.SAVE_PATCHES,
            id: tabId,
            uri: 'http://localhost/module.css',
            patches: [patch('padding:10px')]
        });

        tabItem = store.getState().tabs.get(tabId);
        assert.equal(tabItem.session.patches.size, 2);

        patches = tabItem.session.patches.get('http://localhost/style.css');
        // patches is this resource should be condensed
        assert.equal(patches.length, 1);
        assert.deepEqual(patches[0].update, [{name: 'position', value: 'absolute'}]);

        // remove patches for resource
        dispatch({
            type: TAB.CLEAR_PATCHES,
            id: tabId,
            uri: 'http://localhost/style.css'
        });

        tabItem = store.getState().tabs.get(tabId);
        assert.equal(tabItem.session.patches.size, 1);
        patches = tabItem.session.patches.get('http://localhost/module.css');
        assert.equal(patches.length, 1);
        assert.deepEqual(patches[0].update, [{name: 'padding', value: '10px'}]);
    });
});

'use strict';

const assert = require('assert');
const redux = require('redux');
require('babel-register');
const diff = require('../lib/diff');
const reducer = require('../lib/reducers').default;
const actionNames = require('../lib/action-names');
const TAB = actionNames.TAB;
const SESSION = actionNames.SESSION;

describe('Diff filter', () => {
    var store, dispatch;
    var tabs = {
        t1: {
            origin: 'http://localhost',
            url: 'http://localhost/index.html',
            stylesheets: {
                'default': ['http://localhost/style.css', 'http://localhost/page.css']
            }
        },
        t2: {
            origin: 'http://localhost',
            url: 'http://localhost/test.html',
            stylesheets: {
                'default': ['http://localhost/style.css', 'http://localhost/module.css']
            }
        }
    };

    beforeEach(() => {
        store = redux.createStore(reducer, {
            tabs: new Map(),
            editors: {
                list: new Map(),
                files: new Set(['/dir/style.css', '/dir/module.less'])
            },
            sessions: new Map()
            .set('http://localhost/index.html', {
                enabled: true,
                direction: 'both',
                userMapping: new Map().set('http://localhost/page.css', '/dir/module.less'),
                userStylesheets: new Set()
            })
            .set('http://localhost/test.html', {
                enabled: true,
                direction: 'both',
                userMapping: new Map(),
                userStylesheets: new Set()
            }),
            remoteView: {sessions: new Map()}
        });
        dispatch = action => store.dispatch(action);
    });

    afterEach(() => {
        store = dispatch = null;
    });

    it('filter', () => {
        dispatch({type: TAB.UPDATE_LIST, tabs});

        var patches = [1];
        var state = store.getState();
        var editorPatches = diff.forEditor(state, {
            uri: 'http://localhost/page.css',
            patches
        });

        assert.equal(editorPatches.length, 1);
        assert.equal(editorPatches[0].uri, '/dir/module.less');

        var browserPatches = diff.forBrowser(state, {
            uri: '/dir/style.css',
            patches
        });

        assert.equal(browserPatches.length, 2);
        assert.equal(browserPatches[0].uri, 'http://localhost/style.css');
        assert.equal(browserPatches[1].uri, 'http://localhost/style.css');

        browserPatches = diff.forBrowser(state, {
            uri: '/dir/module.less',
            patches
        });

        assert.equal(browserPatches.length, 2);
        assert.equal(browserPatches[0].uri, 'http://localhost/page.css');
        assert.equal(browserPatches[1].uri, 'http://localhost/module.css');

        // change update direction
        dispatch({
            type: SESSION.UPDATE_DIRECTION,
            id: 'http://localhost/index.html',
            direction: SESSION.DIRECTION_TO_BROWSER
        });
        dispatch({
            type: SESSION.UPDATE_DIRECTION,
            id: 'http://localhost/test.html',
            direction: SESSION.DIRECTION_TO_EDITOR
        });
        state = store.getState();

        browserPatches = diff.forBrowser(state, {
            uri: '/dir/module.less',
            patches
        });

        assert.equal(browserPatches.length, 1);
        assert.equal(browserPatches[0].uri, 'http://localhost/page.css');

        editorPatches = diff.forEditor(state, {
            uri: 'http://localhost/page.css',
            patches
        });

        assert.equal(editorPatches.length, 0);
    });
});

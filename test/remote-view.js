/**
 * Test `remoteView` key reducer
 */
'use strict';

const assert = require('assert');
const redux = require('redux');
const clientShim = require('./shim/client');
require('babel-register');
const reducer = require('../lib/reducers/remote-view').default;
const REMOTE_VIEW = require('../lib/action-names').REMOTE_VIEW;

describe('Remote View', () => {
    var store, dispatch, client, emit, unsubscribe;

    beforeEach(() => {
        store = redux.createStore(reducer, {
            connected: false,
            sessions: new Map()
        });
        dispatch = action => store.dispatch(action);
        // client = clientShim();
        // unsubscribe = listener(client, store);
        // emit = (name, data) => client.emit(name, data);
    });

    afterEach(() => {
        client = store = dispatch = emit = null;
        // unsubscribe();
    });

    describe('reducer', () => {
        it('set session', () => {
            dispatch({
                type: REMOTE_VIEW.SET_SESSION,
                session: {
                    publicId: 'rv.livestyle.io',
                    localSite: 'http://localhost:8080',
                    connectUrl: 'http://livestyle.io:9001',
                    expiresAt: Date.now() + 3000
                }
            });

            var sessions = store.getState().sessions;
            assert.equal(sessions.size, 1);
            assert.equal(sessions.get('http://localhost:8080').state, REMOTE_VIEW.STATE_CONNECTED);
        });

        it('update session list', () => {
            dispatch({
                type: REMOTE_VIEW.UPDATE_SESSION_LIST,
                sessions: [{
                    publicId: 'rv1.livestyle.io',
                    localSite: 'http://localhost:8080',
                    connectUrl: 'http://livestyle.io:9001',
                    expiresAt: Date.now() + 3000
                }, {
                    publicId: 'rv2.livestyle.io',
                    localSite: 'http://localhost:8081',
                    connectUrl: 'http://livestyle.io:9001',
                    expiresAt: Date.now() + 3000
                }]
            });

            var sessions = store.getState().sessions;
            assert.equal(sessions.size, 2);
            assert.equal(sessions.get('http://localhost:8080').state, REMOTE_VIEW.STATE_CONNECTED);
            assert.equal(sessions.get('http://localhost:8080').publicId, 'rv1.livestyle.io');
            assert.equal(sessions.get('http://localhost:8081').state, REMOTE_VIEW.STATE_CONNECTED);
            assert.equal(sessions.get('http://localhost:8081').publicId, 'rv2.livestyle.io');

            dispatch({
                type: REMOTE_VIEW.REMOVE_SESSION,
                localSite: 'http://localhost:8080'
            });
            sessions = store.getState().sessions;
            assert.equal(sessions.size, 1);
            assert.equal(sessions.get('http://localhost:8081').state, REMOTE_VIEW.STATE_CONNECTED);
            assert.equal(sessions.get('http://localhost:8081').publicId, 'rv2.livestyle.io');
        });
    });
});

/**
 * Test `remoteView` key reducer
 */
'use strict';

const assert = require('assert');
const redux = require('redux');
const clientShim = require('./shim/client');
require('babel-register');
const appFactory = require('../').default;
const reducer = require('../lib/reducers/remote-view').default;
const listener = require('../lib/listeners/remote-view').default;
const REMOTE_VIEW = require('../lib/action-names').REMOTE_VIEW;

describe('Remote View', () => {
    var store, dispatch, client, emit, unsubscribe;

    beforeEach(() => {
        store = redux.createStore(reducer, {
            connected: false,
            sessions: new Map()
        });
        dispatch = action => store.dispatch(action);
        client = clientShim();
        unsubscribe = listener(client, store);
        emit = (name, data) => {
            client.emit('message-receive', name, data);
            client.emit(name, data);
        };
    });

    afterEach(() => {
        client = store = dispatch = emit = null;
        unsubscribe();
    });

    describe('reducer', () => {
        it('update session', () => {
            dispatch({
                type: REMOTE_VIEW.UPDATE_SESSION,
                session: {
                    publicId: 'rv.livestyle.io',
                    origin: 'http://localhost:8080',
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
                    origin: 'http://localhost:8080',
                    localSite: 'http://localhost:8080',
                    connectUrl: 'http://livestyle.io:9001',
                    expiresAt: Date.now() + 3000
                }, {
                    publicId: 'rv2.livestyle.io',
                    origin: 'http://localhost:8081',
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
                origin: 'http://localhost:8080'
            });
            sessions = store.getState().sessions;
            assert.equal(sessions.size, 1);
            assert.equal(sessions.get('http://localhost:8081').state, REMOTE_VIEW.STATE_CONNECTED);
            assert.equal(sessions.get('http://localhost:8081').publicId, 'rv2.livestyle.io');
        });
    });

    describe('listener', () => {
        it('ping-pong', done => {
            client.on('rv-ping', () => emit('rv-pong'));
            emit('rv-connection');
            setTimeout(() => {
                assert.equal(store.getState().connected, true);
                done();
            }, 10);
        });

        it('update session list', () => {
            emit('rv-session-list', [{
                publicId: 'rv.livestyle.io',
                origin: 'http://localhost:8080',
                localSite: 'http://localhost:8080',
                connectUrl: 'http://livestyle.io:9001',
                expiresAt: Date.now() + 3000
            }, {
                publicId: 'rv2.livestyle.io',
                origin: 'http://localhost:8081',
                localSite: 'http://localhost:8081',
                connectUrl: 'http://livestyle.io:9001',
                expiresAt: Date.now() + 3000
            }]);

            var sessions = store.getState().sessions;
            assert.equal(sessions.size, 2);
            assert.equal(sessions.get('http://localhost:8080').publicId, 'rv.livestyle.io');
            assert.equal(sessions.get('http://localhost:8080').state, REMOTE_VIEW.STATE_CONNECTED);
            assert.equal(sessions.get('http://localhost:8081').publicId, 'rv2.livestyle.io');
            assert.equal(sessions.get('http://localhost:8081').state, REMOTE_VIEW.STATE_CONNECTED);
        });

        it('request session list on client connect', done => {
            client.on('rv-ping', () => emit('rv-pong'));
            client.on('rv-get-session-list', () => emit('rv-session-list', [{
                    publicId: 'rv.livestyle.io',
                    origin: 'http://localhost:8080',
                    localSite: 'http://localhost:8080',
                    connectUrl: 'http://livestyle.io:9001',
                    expiresAt: Date.now() + 3000
                }, {
                    publicId: 'rv2.livestyle.io',
                    origin: 'http://localhost:8081',
                    localSite: 'http://localhost:8081',
                    connectUrl: 'http://livestyle.io:9001',
                    expiresAt: Date.now() + 3000
                }])
            );

            emit('client-connect');
            setTimeout(() => {
                var sessions = store.getState().sessions;
                assert.equal(sessions.size, 2);
                assert.equal(sessions.get('http://localhost:8080').publicId, 'rv.livestyle.io');
                assert.equal(sessions.get('http://localhost:8081').publicId, 'rv2.livestyle.io');
                done();
            }, 10);
        });

        it('disconnect from app', done => {
            client.on('rv-ping', () => emit('rv-pong'));
            emit('rv-connection');
            setTimeout(() => {
                assert.equal(store.getState().connected, true);
                emit('close');
                assert.equal(store.getState().connected, false);
                done();
            }, 10);
        });
    });

    describe('actions', () => {
        const origin = 'http://localhost:8082';
        // setup event routing
        const setupClient = client =>
            client.on('rv-create-session', data => {
                let response = {origin: data.origin};
                if (!data.authorization) {
                    response.error = 'No auth header';
                } else {
                    Object.assign(response, {
                        localSite: data.origin,
                        publicId: 'rv.livestyle.io',
                        connectUrl: 'http://livestyle.io:9001',
                        expiresAt: Date.now() + 3000
                    });
                }
                client.emit('message-receive', 'rv-session', response);
            });

        it('create session', done => {
            let client = setupClient(clientShim());
            let app = appFactory(client, {autoRemoveRVError: 200});

            const updates = [];
            app.subscribe(sessions => {
                updates.push(sessions.get(origin));

                if (updates.length === 2) {
                    assert.equal(updates[0].state, REMOTE_VIEW.STATE_PENDING);
                    assert.equal(updates[1].state, REMOTE_VIEW.STATE_CONNECTED);

                    assert.equal(updates[0].origin, origin);
                    assert.equal(updates[1].localSite, origin);

                    done();
                }
            }, 'remoteView.sessions');

            app.createRemoteViewSession({
                origin,
                authorization: 'sample-auth'
            });
        });

        it('session error', done => {
            let client = setupClient(clientShim());
            let app = appFactory(client, {autoRemoveRVError: 100});

            const updates = [];
            app.subscribe(sessions => {
                updates.push(sessions.get(origin));

                if (updates.length === 3) {
                    assert.equal(updates[0].state, REMOTE_VIEW.STATE_PENDING);
                    assert.equal(updates[1].state, REMOTE_VIEW.STATE_ERROR);
                    assert.equal(updates[1].error.message, 'No auth header');
                    assert.equal(updates[2], undefined);

                    done();
                }
            }, 'remoteView.sessions');

            app.createRemoteViewSession({origin});
        });
    });
});

/**
 * Remote View actions: create, update and destroy sessions
 */
'use strict';

import request from '../ws-request';
import {REMOTE_VIEW} from '../action-names';

export function createSession(data) {
	assertPayload(data);

	return (dispatch, getState) => {
		let state = getState();
		let client = state.client;
		let session = state.sessions.get(data.origin);
	    if (session && session.state === REMOTE_VIEW.STATE_PENDING) {
	        // connection in progress, do nothing
	        return;
	    }

		dispatch({
			type: REMOTE_VIEW.UPDATE_SESSION,
			session: {
				state: REMOTE_VIEW.STATE_PENDING,
				origin: data.origin
			}
		});

		let createSession = data => {
			return request(client, 'rv-create-session', data)
	        .expect('rv-session', resp => resp.origin === data.origin, 15000)
			.then(resp => {
				if (resp.error) {
					let message = typeof resp.error === 'string' ? resp.error : resp.error.message;
					let err = error(resp.error.code || 'ERVERROR', message);
					return Promise.reject(err);
				}
				return resp;
			});
		};

		startSession(createSession, data)
        .then(resp => dispatch({
			type: REMOTE_VIEW.UPDATE_SESSION,
			session: {
				state: REMOTE_VIEW.STATE_CONNECTED,
				...resp
			}
		}))
		.catch(err => {
			let message = typeof err === 'string' ? err : err.message;
			let code = err.code || 'ERVERROR';
			let session = {
				state: REMOTE_VIEW.STATE_ERROR,
				origin: data.origin,
				error: error(code, message)
			};
			dispatch({
				type: REMOTE_VIEW.UPDATE_SESSION,
				session
			});

			scheduleErroredSessionRemove(session, dispatch, getState);
		});
	};
}

export function closeSession(origin) {
	return (dispatch, getState) => {
		dispatch({type: REMOTE_VIEW.REMOVE_SESSION, origin});
		request(getState().client, 'rv-close-session', {origin});
	};
}

function assertPayload(payload) {
    if (!payload.origin) {
        throw new Error('No "origin" field for Remote View session');
    }
}

/**
 * Start Remote View session using given `createSession` factory and `data`
 * payload.
 * @param  {Function} createSession
 * @param  {Object} data
 * @return {Promise}
 */
function startSession(createSession, data) {
	if (typeof data.delegate === 'function') {
		// If `delegate` method is provided, delegate session creation to this
		// method and expect a promise. Mostly required by Chrome extension:
		// it must issue OAuth token for user and handle specific cases then
		// token is expired
		let delegate = data.delegate;
		data = {...data};
		delete data.delegate;
		return delegate(createSession, data);
	}

	return createSession(data);
}

function scheduleErroredSessionRemove(session, dispatch, getState) {
	let options = getState().options || {};
	if (!options.autoRemoveRVError) {
		return;
	}

	setTimeout(() => {
		// make sure session state is the same
		let curSession = getState().remoteView.sessions.get(session.origin);
		if (curSession && curSession.state === session.state && curSession.error === session.error) {
			dispatch({
				type: REMOTE_VIEW.REMOVE_SESSION,
				origin: session.origin
			});
		}
	}, options.autoRemoveRVError);
}

function error(code, message) {
	let err = new Error(message || code);
	err.code = code;
	return err;
}

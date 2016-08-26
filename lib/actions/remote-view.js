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

		request(client, 'rv-create-session', data)
        .expect('rv-session', resp => resp.origin === data.origin, 15000)
        .then(resp => {
			if (resp.error) {
				return Promise.reject(resp.error);
			}

			dispatch({
				type: REMOTE_VIEW.UPDATE_SESSION,
				session: {
					state: REMOTE_VIEW.STATE_CONNECTED,
					...resp
				}
			});
		})
		.catch(err => {
			let message = typeof err === 'string' ? err : err.message;
			let code = err.code || 'ERVERROR';
			dispatch({
				type: REMOTE_VIEW.UPDATE_SESSION,
				session: {
					state: REMOTE_VIEW.STATE_ERROR,
					error: {message, code}
				}
			});
		});
	};
}

export function closeSession(origin) {
	return (dispatch, getState) => {
		dispatch({
			type: REMOTE_VIEW.REMOVE_SESSION,
			origin: origin
		});

		request(getState().client, 'rv-close-session', {origin});
	};
}

function assertPayload(payload) {
    if (!payload.origin) {
        throw new Error('No "origin" field for Remote View session');
    }
}

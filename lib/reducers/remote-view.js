/**
 * Reducers for Remote View
 */
'use strict';

import {REMOTE_VIEW} from '../action-names';
import immutable from '../immutable';

export default function(state={}, action) {
    state = immutable(state);

	switch (action.type) {
		case REMOTE_VIEW.SET_STATUS:
			if (state.get('connected') !== action.connected) {
                state.set('connected', action.connected);
				if (!action.connected) {
                    state.set('sessions', new Map());
				}
			}
			break;

		case REMOTE_VIEW.UPDATE_SESSION:
            if (action.session && action.session.origin) {
                let session = {
                    state: REMOTE_VIEW.STATE_CONNECTED,
                    ...action.session
                };
                state.set(['sessions', session.origin], session);
            } else {
                console.warn('Unable to update Remote View session: no session data or origin in action');
            }
            break;

		case REMOTE_VIEW.UPDATE_SESSION_LIST:
            let sessions = state.get('sessions');
            let allOrigins = new Set(sessions.keys());
            action.sessions.forEach(session => {
                state.set(['sessions', session.origin], {
                    state: REMOTE_VIEW.STATE_CONNECTED,
                    ...session
                });
                allOrigins.delete(session.origin);
            });

            // remove redundant sessions
            allOrigins.forEach(origin => state.delete(['sessions', origin]));

            break;

        case REMOTE_VIEW.REMOVE_SESSION:
            state.delete(['sessions', action.origin]);
            break;
	}

	return state.value;
};

/**
 * Remote View controller: handles communication with LiveStyle app
 * regarding Remote View sessions. Current Remote View session list is available
 * in global store
 */
'use strict';

import request from '../ws-request';
import {REMOTE_VIEW} from '../action-names';

/**
 * Listens to Remote View-related events in given `client` and updates
 * `store` with fresh data. Returns a function that, when called, will
 * stop listening Remote View events
 * @param {LiveStyleClient} client
 * @param {Redux} store
 * @return {Function}
 */
export default function(client, store) {
    var onSessionList = sessions => store.dispatch({
        type: REMOTE_VIEW.UPDATE_SESSION_LIST,
        sessions
    });

    var setConnectionStatus = connected => {
    	store.dispatch({type: REMOTE_VIEW.SET_STATUS, connected});
    	return connected;
    };

    var onDisconnect = () => setConnectionStatus(false);

    var checkConnection = () => {
    	return request(client, 'rv-ping')
    	.expect('rv-pong')
    	.then(() => setConnectionStatus(true), () => setConnectionStatus(false));
    };

    var requestSessionList = () => {
    	return checkConnection()
        .then(connected => connected && request(client, 'rv-get-session-list'));
    };

    client
    .on('rv-connection', checkConnection) // used for debugging only
    .on('rv-session-list', onSessionList)
    .on('open client-connect client-disconnect', requestSessionList)
    .on('close', onDisconnect);

    requestSessionList();

    return () => {
        client
        .off('rv-connection', checkConnection)
        .off('rv-session-list', onSessionList)
        .off('open client-connect client-disconnect', requestSessionList)
        .off('close', onDisconnect);
    };
};

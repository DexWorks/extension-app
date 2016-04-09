/**
 * Creates and destroys Remote View sessions
 */
'use strict';

import request from './ws-request';

const REQUEST_SESSION_URL = 'http://livestyle.io:9000/connect/';
const defaultErrorMessage = 'Unable to create session, Remote View server is not available. Please try again later.';

export function createSession(client, payload) {
    return createHTTPServerIfRequired(client, payload)
    .then(payload => requestSession(client, payload))
    .then(payload => {
        return request(client, 'rv-create-session', payload)
        .expect('rv-session', data => data.localSite === payload.localSite, 15000);
    });
}

export function destroySession(client, localSite) {
	request(client, 'rv-close-session', {localSite});
}

function createHTTPServerIfRequired(client, payload) {
	if (!/^file:/.test(payload.localSite)) {
		return Promise.resolve(payload);
	}

	var docroot = payload.localSite;
	console.log('create HTTP server for', docroot);
	return request(client, 'rv-create-http-server', {docroot})
	.expect('rv-http-server', data => data.docroot === docroot)
	.then(data => ({...payload, localSite: data.origin}));
}

function requestSession(client, payload) {
    if (!payload.authorization) {
        return Promise.reject(error('ERVNOAUTH', 'No authorization header in payload'));
    }

	return fetch(REQUEST_SESSION_URL, {
		method: 'POST',
		headers: {
			Authorization: payload.authorization,
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			localSite: payload.localSite
		})
	})
	.then(function(res) {
        return res.json()
        .then(data => {
            return res.ok ? data : Promise.reject(error(res.status, data && data.error ? data.error.message : defaultErrorMessage));
        });
	}, () => Promise.reject(error('ERVSESSION', defaultErrorMessage)));
}

function error(code, message) {
    var err = new Error(code || message);
    err.code = code;
    return err;
}

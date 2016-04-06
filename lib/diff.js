/**
 * Applies given diff to all active sessions
 */
'use strict';
import {SESSION} from './action-names';

/**
 * For given diff, find editor stylesheets from tab sessions that must
 * be updated with patches in `diff`
 * @param  {Object} diff  Browser-generated diff
 * @param  {Object} state Current storage state
 * @return {Array}
 */
export function forEditor(state, diff) {
    // should keep unique files only
    var lookup = new Set();
    return filter(state, diff, SESSION.DIRECTION_TO_BROWSER)
    .filter(item => !lookup.has(item.uri) && lookup.add(item.uri));
}

/**
 * Returns array of payloads that should be applied on browser files for given
 * diff
 * @param  {Object} state Current storage state
 * @param  {Object} diff  Editor-generated diff
 * @return {Array}
 */
export function forBrowser(state, diff) {
    return filter(state, diff, SESSION.DIRECTION_TO_EDITOR, 'key');
}

function filter(state, diff, excludeDirection, mappingType='value') {
    var patches = diff.patches;
    if (!patches || !patches.length) {
		return [];
	}

    var excludeTabId = new Set(diff.excludeTabId || []);
    var result = [];
    for (let [tabId, tab] of state.tabs) {
        if (excludeTabId.has(tabId) || !tab.session || getUpdateDirection(state, tab.session.id) === excludeDirection) {
            continue;
        }

        let uri = mappingType === 'key'
            ? keyForValue(tab.session.mapping, diff.uri)
            : tab.session.mapping.get(diff.uri);

        if (uri) {
            result.push({tabId, uri , patches});
        }
    }
    return result;
}

function getUpdateDirection(state, sessionId) {
    return state.sessions.get(sessionId).direction;
}

function keyForValue(map, value) {
    for (let [k, v] of map) {
        if (v === value) {
            return k;
        }
    }
}

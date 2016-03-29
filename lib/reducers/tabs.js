/**
 * Redux reducers for tabs.
 * This reducer requires `tabs`, `sessions` and `remoteView` keys so it works
 * with entire store
 */
'use strict';

import {TAB} from '../action-names';

import {has, get, copy, iterate, normalizeUrl, isSameSet, isSameMap} from '../utils';
import {set, remove} from '../immutable';
import calculateMapping from '../mapping';

const tabIdentityKeys = ['url', 'origin'];

/**
 * Syncs given list of tabs with store: new tabs will be added, old (non-existing)
 * will be removed
 * @param  {Object} store Current app store
 * @param  {Map|Object} tabs Either map or hash of currently opened tabs
 * @return {Object} Updated or same store
 */
function syncTabs(store, tabs) {
    var tabIds = new Set(tabs instanceof Map ? tabs.keys() : Object.keys(tabs));
    var curTabs = store.tabs;
    var updated = new Map();
    var added = new Map();
    var removed = new Set();

    tabIds.forEach(id => {
        let nextTab = get(tabs, id);
        let curTab = get(curTabs, id);

        if (curTab && !sameIdentity(curTab, nextTab)) {
            // tab exists but points to different URL, should update session
            // and Remote View data
            updated.set(id, copyIdentity(nextTab, copy(curTab)));
        } else if (!curTab) {
            // tab does not exists, create new one
            added.set(id, copyIdentity(nextTab, {
                stylesheets: {},
                remoteView: null,
                session: null
            }));
        }
    });

    for (let id of curTabs) {
        if (!tabIds.has(id)) {
            removed.add(id);
        }
    }

    if (!updated.size && !added.size && !removed.size) {
        return state;
    }

    curTabs = copy(curTabs);
    removed.forEach(id => curTabs.delete(id));

    // TODO update session data for created and updated tabs
}

function sameIdentity(obj1, obj2) {
    return tabIdentityKeys.every(key => normalizeUrl(obj1[key]) === normalizeUrl(obj2[key]));
}

function copyIdentity(src, dest) {
    tabIdentityKeys.forEach(k => dest[k] = normalizeUrl(src[k]));
    return dest;
}

function currentSessionForTab(state, tab) {
    var session = findSessionForTab(state, tab);
    if (!session) {
        return null;
    }

    var curSession = tab.session || {
        id: tab.url,
        stylesheets: new Set(),
        mapping: new Map(),
        patches: new Map(),
        requestedUnsavedFiles: new Set()
    };

    var updated = new Map();
    var stylesheets = calculateStylesheetsForSession(tab);
    var mapping = getMapping(state, tab, stylesheets);

    if (!isSameSet(curSession.stylesheets, stylesheets)) {
        updated.set('stylesheets', stylesheets);
    }

    if (!isSameMap(curSession.mapping, mapping)) {
        updated.set('mapping', mapping);
    }

    if (updated.size) {
        curSession = copy(curSession);
        updated.forEach((value, key) => curSession[key] = value);
    }

    return curSession;
}

function getRemoteViewForTab(state, tab) {

}

function findSessionForTab(state, tab) {
    var session = get(state.sessions, tab.url);
    return session && session.enabled ? session : null;
}

/**
 * Calculates final list of tab stylesheets available for current session.
 * @param  {Object} tab Tab descriptor
 * @return {Set}
 */
function calculateStylesheetsForSession(tab) {
    var result = new Set();
    // collect stylesheets from different zones
    iterate(tab.stylesheets, items => {
        var isMap = items instanceof Map;
        iterate(items, (value, key) => result.add(isMap ? key : value));
    });
    return result;
}

/**
 * Get up-to-date browser-to-editor file mapping for given tab
 * @param  {Object} state Current store state
 * @param  {Object} tab   Tab descriptor
 * @return {Map}
 */
function getMapping(state, tab, stylesheets=calculateStylesheetsForSession(tab)) {
    var session = findSessionForTab(state, tab);
    var userMapping = session ? sessoin.userMapping : null;
    return calculateMapping(stylesheets, Array.from(state.editors.files), userMapping);
}

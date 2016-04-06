/**
 * Redux reducers for tabs.
 * This reducer requires `tabs`, `sessions` and `remoteView` keys so it works
 * with entire store
 */
'use strict';

import equal from 'deep-equal';
import condense from 'condense-patches';
import {TAB, EDITOR, SESSION} from '../action-names';
import {get, has, copy, iterate, normalizeUrl, deepSet, hasValue, set as setMutable, keys} from '../utils';
import {set, remove} from '../immutable';
import calculateMapping from '../mapping';

const tabIdentityKeys = ['url', 'origin'];

export default function(state={}, action) {
    switch (action.type) {
        case TAB.UPDATE_LIST:
            return syncTabs(state, action.tabs);
        case TAB.SET_STYLESHEET_DATA:
            return setStylesheetData(state, action.id, action.items, action.zone);
        case TAB.UPDATE_STYLESHEET_ITEM:
            return updateStylesheetItem(state, action.id, action.itemId, action.itemValue, action.zone);
        case TAB.SAVE_PATCHES:
            return savePatches(state, action.id, action.uri, action.patches);
        case TAB.CLEAR_PATCHES:
            return clearPatches(state, action.id, action.uri);
        case TAB.ADD_REQUESTED_UNSAVED_FILES:
            return addRequestedUnsavedFiles(state, action.id, action.files);
    }

    if (hasValue(SESSION, action.type) || hasValue(EDITOR, action.type)) {
        // for EDITOR.* action update tab content one-by-one, if required
        let updated = new Map();
        let tabs = state.tabs;
        iterate(tabs, (tab, id) => {
            var newTab = syncTabContent(state, tab);
            if (tab !== newTab) {
                updated.set(id, newTab);
            }
        });

        if (updated.size) {
            tabs = copy(tabs);
            updated.forEach((tab, id) => setMutable(tabs, id, tab));
            return set(state, 'tabs', tabs);
        }
    }

    return state;
}

/**
 * Syncs given list of tabs with store: new tabs will be added, old (non-existing)
 * will be removed
 * @param  {Object} state Current Redux store state
 * @param  {Map|Object} tabs Either map or hash of currently opened tabs
 * @param  {Boolean} force Force tab contents re-calculation, even if state `tabs`
 * key seems unchanged
 * @return {Object} Updated or same store
 */
export function syncTabs(state, tabs, force=false) {
    var tabIds = new Set(keys(tabs));
    var curTabs = state.tabs;
    var updated = new Map();
    var added = new Map();
    var removed = new Set();

    tabIds.forEach(id => {
        let nextTab = get(tabs, id);
        let curTab = get(curTabs, id);

        if (curTab) {
            let _curTab = curTab;
            if (!sameIdentity(curTab, nextTab)) {
                // tab exists but points to different URL, should update session
                // and Remote View data
                _curTab = copyIdentity(nextTab, copy(curTab));
            }

            if (nextTab.stylesheets) {
                // provided zone-separated list of initial stylesheets
                keys(nextTab.stylesheets).forEach(zone => {
                    _curTab = deepSet(_curTab, `stylesheets.${zone}`, get(nextTab.stylesheets, zone));
                });
            }

            if (_curTab !== curTab) {
                updated.set(id, _curTab);
            }
        } else {
            // tab does not exists, create new one
            added.set(id, copyIdentity(nextTab, {
                stylesheets: nextTab.stylesheets || {},
                remoteView: null,
                session: null
            }));
        }
    });

    for (let id of curTabs.keys()) {
        if (!tabIds.has(id)) {
            removed.add(id);
        }
    }

    if (!force && !updated.size && !added.size && !removed.size) {
        return state;
    }

    curTabs = copy(curTabs);
    removed.forEach(id => curTabs.delete(id));

    // `curTabs` now contains only updated tabs
    var updateTabIterator = (tab, key) => curTabs.set(key, syncTabContent(state, tab));
    curTabs.forEach(updateTabIterator);
    added.forEach(updateTabIterator);

    return set(state, 'tabs', curTabs);
}

/**
 * Syncs content of a single tab: matched Remote View and LiveStyle sessoins.
 * Returns new Tab object if data was changed
 * @param  {Object} state Current Redux state
 * @param  {Object} tab   Tab item, from `tabs` state key
 * @return {Object}
 */
function syncTabContent(state, tab) {
    var session = currentSessionForTab(state, tab);
    if (!equal(tab.session, session)) {
        tab = set(tab, 'session', session);
    }

    // find matching Remote View session
    if (state.remoteView) {
        var remoteView = has(state.remoteView.sessions, tab.origin) ? tab.origin : null;
        if (!equal(tab.remoteView, remoteView)) {
            tab = set(tab, 'remoteView', remoteView);
        }
    }

    return tab;
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

    if (!equal(curSession.stylesheets, stylesheets)) {
        updated.set('stylesheets', stylesheets);
    }

    if (!equal(curSession.mapping, mapping)) {
        updated.set('mapping', mapping);
    }

    if (updated.size) {
        // we have updates, create new session object as well to trigger
        // Redux watchers
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
    var userMapping = session ? session.userMapping : null;
    return calculateMapping(stylesheets, Array.from(state.editors.files), userMapping);
}

function setStylesheetData(state, id, items, zone='default') {
    var tab = get(state.tabs, id);
    if (!tab || equal(get(tab.stylesheets, zone), items)) {
        return state;
    }

    tab = deepSet(tab, `stylesheets.${zone}`, items);
    state = copy(state);
    state.tabs = set(state.tabs, id, syncTabContent(state, tab));
    return state;
}

function updateStylesheetItem(state, id, itemId, itemValue, zone='default') {
    var tab = get(state.tabs, id);
    if (!tab) {
        return state;
    }

    var zoneData = get(tab.stylesheets, zone) || new Map();
    if (get(zoneData, itemId) !== itemValue) {
        tab = deepSet(tab, `stylesheets.${zone}`, set(zoneData, itemId, itemValue));
        state = copy(state);
        state.tabs = set(state.tabs, id, syncTabContent(state, tab));
    }

    return state;
}

function savePatches(state, id, uri, patches) {
    var tab = get(state.tabs, id);
    if (tab && tab.session) {
        if (!Array.isArray(patches)) {
            patches = [patches];
        }
        let tabPatches = new Map(tab.session.patches);
        let prevValues = tabPatches.get(uri) || [];
        let newValues = condense(prevValues.concat(patches));
        if (newValues) {
            tabPatches.set(uri, newValues);
        } else {
            tabPatches.delete(uri);
        }

        state = copy(state);
        state.tabs = set(state.tabs, id, deepSet(tab, 'session.patches', tabPatches));
    }
    return state;
}

function clearPatches(state, id, uri) {
    var tab = get(state.tabs, id);
    if (tab && tab.session && tab.session.patches.has(uri)) {
        let patches = remove(tab.session.patches, uri);
        state = copy(state);
        state.tabs = set(state.tabs, id, deepSet(tab, 'session.patches', patches));
    }
    return state;
}

function addRequestedUnsavedFiles(state, id, files) {
    var tab = get(state.tabs, id);
    if (tab && tab.session) {
        var requestedUnsavedFiles = new Set(tab.session.requestedUnsavedFiles || []);
        files.forEach(file => requestedUnsavedFiles.add(file));

        state = copy(state);
        state.tabs = set(state.tabs, id, deepSet(tab, 'session.requestedUnsavedFiles', requestedUnsavedFiles));
    }
    return state;
}

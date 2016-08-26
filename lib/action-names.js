'use strict';

export const EDITOR = {
    CONNECT: 'Editor connected',
    DISCONNECT: 'Editor disconnected',
    CLEAR: 'Clear all connected editors',
    UPDATE_FILE_LIST: 'Update opened file list in editor'
};

export const SESSION = {
    LOAD: 'Bulk load session data',
    TOGGLE_ENABLED: 'Toggle session enabled state',
    LAST_USED: 'Updates last used data',
    UPDATE_FILE_MAPPING: 'Explicitly map editor file to browser one',
    UPDATE_DIRECTION: 'Update changes transmit direction',
    ADD_USER_STYLESHEET: 'Add user stylesheet',
    REMOVE_USER_STYLESHEET: 'Remove user stylesheet',

    DIRECTION_BOTH: 'both',
    DIRECTION_TO_BROWSER: 'to browser',
    DIRECTION_TO_EDITOR: 'to editor'
};

export const TAB = {
    UPDATE_LIST: 'Update tabs list',
    SET_STYLESHEET_DATA: 'Set stylesheet data for given zone',
    UPDATE_STYLESHEET_ITEM: 'Updates stylesheet item in given zone',
    SAVE_PATCHES: 'Save resource patches',
    CLEAR_PATCHES: 'Clear resource patches',
    ADD_REQUESTED_UNSAVED_FILES: 'Add files that were requested for unsaved changes'
};

export const REMOTE_VIEW = {
    SET_STATUS: 'Set Remote View activity status',
    UPDATE_SESSION: 'Update Remote View session',
    UPDATE_SESSION_LIST: 'Update list of available Remote View sessions',
    REMOVE_SESSION: 'Remove Remote View session',

    // Remote View session connection state
    STATE_CONNECTED: 'connected',
    STATE_PENDING: 'pending',
    STATE_ERROR: 'error'
};

'use strict';

export const EDITOR = {
    CONNECT: 'Editor connected',
    DISCONNECT: 'Editor disconnected',
    CLEAR: 'Clear all connected editors',
    UPDATE_FILE_LIST: 'Update opened file list in editor'
};

export const SESSION = {
    TOGGLE_ENABLED: 'Toggle page enabled state',
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
};

// export const SESSION = {
//     SET_CSSOM_STYLESHEETS: 'Update list of CSSOM stylesheets',
//     SET_DEVTOOLS_STYLESHEETS: 'Update list of DevTools stylesheets',
//     SET_USER_STYLESHEETS: 'Set user stylesheets for session',
//     SET_ORIGIN: 'Set session origin',
//     UPDATE_DEVTOOLS_STYLESHEET: 'Update DevTools stylesheet content',
//     UPDATE_STYLESHEETS: 'Update browser stylesheets list',
//     UPDATE_MAPPING: 'Update browser-to-editor file mappings',
//     UPDATE_LIST: 'Update sessions list',
//     SAVE_RESOURCE_PATCHES: 'Save incoming resource patches',
//     RESET_RESOURCE_PATCHES: 'Reset saved resource patches',
//     ADD_REQUESTED_UNSAVED_FILES: 'Add files that were requested for unsaved changes'
// };

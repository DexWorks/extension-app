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

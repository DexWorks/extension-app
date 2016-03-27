'use strict';
import {EDITOR} from '../action-names';

/**
 * Listens to editor-related events in given `client` and updates
 * `store` with editor data. Returns a function that, when called, will
 * stop listening editor events
 * @param {LiveStyleClient} client
 * @param {Redux} store
 */
export default function(client, store) {
    let onConnect = editor => store.dispatch({type: EDITOR.CONNECT, editor});
    let onDisconnect = editor => store.dispatch({type: EDITOR.DISCONNECT, editor});
    let onUpdateFiles = editor => store.dispatch({type: EDITOR.UPDATE_FILE_LIST, editor});

    client
    .on('editor-connect', onConnect)
    .on('editor-disconnect', onDisconnect)
    .on('editor-files', onUpdateFiles);

    return () => {
        client
        .off('editor-connect', onConnect)
        .off('editor-disconnect', onDisconnect)
        .off('editor-files', onUpdateFiles);
    };
}

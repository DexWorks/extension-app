/**
 * Redux store reducer for `editors` key
 */
'use strict';
import {EDITOR} from '../action-names';
import {has, copy, deepGet, deepSet, isSameSet} from '../utils';

export default function(state={}, action) {
    var key, files;
    var prevState = state;

    switch (action.type) {
        case EDITOR.CONNECT:
            state = createEditorEntryIfRequired(state, action.editor);
            break;

        case EDITOR.DISCONNECT:
            if (has(state.list, action.id)) {
                let list = copy(state.list);
                list.delete(action.id);
                state = {...state, list};
            }
            break;

        case EDITOR.UPDATE_FILE_LIST:
            state = createEditorEntryIfRequired(state, action.editor);
            files = new Set(action.editor.files);
            key = `list.${action.editor.id}.files`;
            if (!isSameSet(files, deepGet(state, key))) {
                state = deepSet(state, key, files);
            }
            break;

        case EDITOR.CLEAR:
            state = {...state, list: new Map()};
            break;
    }

    return state;
}

function createEditorEntryIfRequired(state, editor) {
    if (editor && editor.id && !has(state.list, editor.id)) {
        state = {
            ...state,
            list: copy(state.list).set(editor.id, {
                name: editor.name,
                files: new Set(editor.files)
            })
        };
    }
    return state;
}

/**
 * Redux store reducer for `editors` key
 */
'use strict';
import {EDITOR} from '../action-names';
import {has, copy, deepGet, deepSet, isSameSet, iterate} from '../utils';

export default function(state={}, action) {
    var key, files;
    var prevState = state;

    switch (action.type) {
        case EDITOR.CONNECT:
            state = createEditorEntryIfRequired(state, action.editor);
            break;

        case EDITOR.DISCONNECT:
            if (has(state.list, action.editor.id)) {
                let list = copy(state.list);
                list.delete(action.editor.id);
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

    if (prevState !== state) {
        state = updateFileList(state);
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

/**
 * Updates overall file list if given state, if required
 * @param  {Object} state
 * @return {Object}
 */
function updateFileList(state) {
    var files = new Set();
    state.list.forEach(editor => append(files, editor.files));
    if (!isSameSet(files, state.files)) {
        state = {...state, files};
    }
    return state;
}

function append(target, dest) {
    dest.forEach(value => target.add(value));
    return dest;
}

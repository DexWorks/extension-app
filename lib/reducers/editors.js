/**
 * Redux store reducer for `editors` key
 */
'use strict';
import equal from 'deep-equal';
import {EDITOR} from '../action-names';
import {has, get, iterate} from '../utils';
import {set, remove} from '../immutable';

export default function(state={}, action) {
    var key, editor, files;
    var prevState = state;

    switch (action.type) {
        case EDITOR.CONNECT:
            state = createEditorEntryIfRequired(state, action.editor);
            break;

        case EDITOR.DISCONNECT:
            if (has(state.list, action.editor.id)) {
                state = set(state, 'list', remove(state.list, action.editor.id));
            }
            break;

        case EDITOR.UPDATE_FILE_LIST:
            state = createEditorEntryIfRequired(state, action.editor);
            editor = get(state.list, action.editor.id);
            files = new Set(action.editor.files);
            if (!equal(files, editor.files)) {
                editor = set(editor, 'files', files);
                state = set(state, 'list', set(state.list, action.editor.id, editor));
            }
            break;

        case EDITOR.CLEAR:
            state = set(state, 'list', new Map());
            break;
    }

    if (prevState !== state) {
        state = updateFileList(state);
    }

    return state;
}

function createEditorEntryIfRequired(state, editor) {
    if (editor && editor.id && !has(state.list, editor.id)) {
        var list = set(state.list, editor.id, {
            name: editor.name,
            files: new Set(editor.files)
        });
        state = set(state, 'list', list);
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
    console.log('cmp', files, state.files);
    if (!equal(files, state.files)) {
        state = set(state, 'files', files);
    }
    return state;
}

function append(target, dest) {
    dest.forEach(value => target.add(value));
    return dest;
}

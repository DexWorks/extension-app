/**
 * Test `editors` key reducer
 */
'use strict';

const assert = require('assert');
const redux = require('redux');
const clientShim = require('./shim/client');
require('babel-register');
const reducer = require('../lib/reducers/editors').default;
const listener = require('../lib/listeners/editors').default;

describe('Editors reducer', () => {
    var client, store, emit, unsubscribe;
    var editor1 = {
        id: 'sample-editor1',
        name: 'Sample Editor 1',
        files: ['foo.css', 'bar.less']
    };
    var editor2 = {
        id: 'sample-editor2',
        name: 'Sample Editor 2',
        files: ['foo.css', 'baz.scss']
    };

    beforeEach(() => {
        client = clientShim();
        store = redux.createStore(reducer, {
            list: new Map(),
            files: new Set()
        });
        unsubscribe = listener(client, store);
        emit = (name, data) => client.emit(name, data);
    });

    afterEach(() => {
        client = store = null;
        unsubscribe();
    });

    it('add editor', () => {
        emit('editor-connect', editor1);
        emit('editor-connect', editor2);

        var state = store.getState();

        assert.equal(state.list.size, 2);
        assert.deepEqual(Array.from(state.list.keys()), [editor1.id, editor2.id]);
        assert.deepEqual(Array.from(state.list.get(editor1.id).files), editor1.files);
        assert.deepEqual(Array.from(state.list.get(editor2.id).files), editor2.files);

        assert.equal(state.files.size, 3);
        assert.deepEqual(Array.from(state.files), ['foo.css', 'bar.less', 'baz.scss']);
    });

    it('remove editor', () => {
        emit('editor-connect', editor1);
        emit('editor-connect', editor2);
        emit('editor-disconnect', editor1);

        var state = store.getState();

        assert.equal(state.list.size, 1);
        assert.deepEqual(Array.from(state.list.keys()), [editor2.id]);
        assert.deepEqual(Array.from(state.list.get(editor2.id).files), editor2.files);

        assert.equal(state.files.size, 2);
        assert.deepEqual(Array.from(state.files), editor2.files);
    });

    it('update editor files', () => {
        emit('editor-connect', editor1);
        emit('editor-connect', editor2);
        emit('editor-files', {id: editor1.id, files: ['foo.baz']});

        var state = store.getState();

        assert.equal(state.list.size, 2);
        assert.deepEqual(Array.from(state.list.keys()), [editor1.id, editor2.id]);
        assert.deepEqual(Array.from(state.list.get(editor1.id).files), ['foo.baz']);
        assert.deepEqual(Array.from(state.list.get(editor2.id).files), editor2.files);

        assert.equal(state.files.size, 3);
        assert.deepEqual(Array.from(state.files), ['foo.baz', 'foo.css', 'baz.scss']);
    });

    it('keep file list unchanged', () => {
        emit('editor-connect', editor1);
        emit('editor-connect', editor2);

        var state1 = store.getState();
        emit('editor-files', {id: editor1.id, files: editor1.files.slice().reverse()});
        var state2 = store.getState();

        assert.equal(state1.files, state2.files);
    });
});

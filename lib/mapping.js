/**
 * Calculates browser-to-editor file mappings from given data.
 * Also tries to automatically map files where possible
 */
'use strict';
import {iterate, makeArray, makeMap} from './utils';

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

/**
 * Calculates browser-to-editor file mappings from given data.
 * Also tries to automatically map files where possible
 * @param  {Array|Set} browser  List of browser files
 * @param  {Array|Set} editor   List of editor files
 * @param  {Object|Map} userMapping User-defined browser-to-editor mappings
 * @return {Map}
 */
export default function(browser, editor, userMapping) {
    browser = browser || EMPTY_ARRAY;
    editor = editor || EMPTY_ARRAY;
    userMapping = userMapping || EMPTY_OBJECT;

    return makeMap({
        ...autoMap(browser, editor),
        ...getValidMappings(userMapping, browser, editor)
    });
};

function autoMap(browser=[], editor=[]) {
    var out = {};
    iterate(browser, file => {
        var mapped = autoMapBrowserFile(file, editor);
        if (mapped) {
            out[file] = mapped;
        }
    });
    return out;
};

function autoMapBrowserFile(file, list) {
	let fileLookup = pathLookup(file);
    let compare = candidate => {
        let part = candidate.lookup.pop();
        let curPart = fileLookup[fileLookup.length - 1];
        return curPart === part || cleanFileName(curPart) === cleanFileName(part);
    };
    let candidates = makeArray(list)
    .map(path => ({path, lookup: pathLookup(path)}))
    .filter(compare);

    // if there’s no candidates after initial check (e.g. there’s no files with
    // the same name) — abort, no need to search further
    if (!candidates.length) {
        return;
    }

    // narrow down candidates list
    fileLookup.pop();
    while (fileLookup.length && candidates.length > 1) {
        let nextCandidates = candidates.filter(compare);
        if (!nextCandidates.length) {
            break;
        }
        candidates = nextCandidates;
        fileLookup.pop();
    }

    return candidates[0].path;
}

function pathLookup(path) {
	return path.split('?')[0].split('/').filter(Boolean);
}

function cleanFileName(file) {
	return file.replace(/\.\w+$/, '');
}

function getValidMappings(mappings, browser, editor) {
    browser = new Set(browser);
    editor = new Set(editor);
    var out = {};
    iterate(mappings, (value, key) => {
        if (browser.has(key) && editor.has(value)) {
            out[key] = value;
        }
    });
    return out;
}

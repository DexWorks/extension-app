/**
 * Some immutable-like helpers: instead of updating given object directly,
 * it creates object copy so original object stays immutable
 */
'use strict';
import {copy, has, get, set as setMutable, remove as removeMutable} from './utils';

export function set(obj, key, value) {
    return setMutable(copy(obj), key, value);
}

export function remove(obj, key) {
    return removeMutable(copy(obj), key);
}

export default function immutable(obj) {
    if (obj && obj.__immutable) {
        return obj;
    }

    let original = obj;
    return {
        __immutable: true,

        has(key) {
            let empty = {};
            return this.get(key, empty) !== empty;
        },

        /**
         * Get value from given object by given deep (dot-separated) key
         * @param  {Object} obj
         * @param  {Array|String} key
         * @return {any}
         */
        get(key, empty) {
            let _obj = obj;
            let parts = keyParts(key);
            for (var i = 0, il = parts.length; i < il; i++) {
                let k = parts[i];
                if (has(_obj, k)) {
                    _obj = get(_obj, k);
                } else {
                    return empty;
                }
            }

            return _obj;
        },

        /**
         * Updates `key` value in given `obj` by creating new instances of
         * intermediate objects of deep `key`
         * @param  {Object} obj
         * @param  {Array|String} key
         * @param  {any} value
         * @return {Object}
         */
        set(key, value, assign) {
            let parts = keyParts(copy(key));
        	let lastKey = parts.pop();
            if (obj === original) {
                // main object wasn’t updated yet, create its copy
                obj = copy(obj);
            }

        	let inner = createIntermediate(obj, original, parts);

            if (assign) {
                value = Object.assign({}, get(inner, lastKey), value);
            }
        	setMutable(inner, lastKey, value);
        	return this;
        },

        assign(key, value) {
            return this.set(key, value, true);
        },

        delete(key) {
            let parts = keyParts(copy(key));
            if (this.has(parts)) {
                let lastKey = parts.pop();
                if (obj === original) {
                    // main object wasn’t updated yet, create its copy
                    obj = copy(obj);
                }

                let inner = createIntermediate(obj, original, parts);
                removeMutable(inner, lastKey);
            }
        	return this;
        },

        get updated() {
            return original !== obj;
        },

        get value() {
            return obj;
        },

        get original() {
            return original;
        }
    };
}

function keyParts(key) {
    return Array.isArray(key) ? key : key.split('.');
}

function createIntermediate(obj, original, key) {
    let _obj = obj, _original = original;
    keyParts(key).forEach(k => {
        // Will take every branch from both origin and context object
        // and check if it was updated. If not, create a copy
        let inner = get(_obj, k);
        _original = get(_original, k);

        if (inner === _original || inner == null) {
            inner = inner != null ? copy(inner) : {};
            setMutable(_obj, k, inner);
        }

        _obj = inner;
    });
    return _obj;
}

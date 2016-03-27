/**
 * Some immutable-like helpers: instead of updating given object directly,
 * it creates object copy so original object stays immutable
 */
'use strict';
import {set as setMutable, remove as removeMutable, copy} from './utils';

export function set(obj, key, value) {
    return setMutable(copy(obj), key, value);
}

export function remove(obj, key) {
    return removeMutable(copy(obj), key);
}

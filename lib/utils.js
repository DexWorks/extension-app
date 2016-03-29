'use strict';

/**
 * Check if given object or map contains `key`
 * @param  {Object|Map}  obj
 * @param  {String}  key
 * @return {Boolean}
 */
export function has(obj, key) {
	return obj instanceof Map || obj instanceof Set ? obj.has(key) : key in obj;
}

/**
 * Get `key` value from given object or map
 * @param  {Object|Map} obj
 * @param  {String} key
 * @return {any}
 */
export function get(obj, key) {
	return obj instanceof Map ? obj.get(key) : obj[key];
}

/**
 * Set `key` value in given object or map
 * @param {Object|Map} obj
 * @param {String} key
 * @param {any} value
 * @return {Object|Map}
 */
export function set(obj, key, value) {
	return obj instanceof Map ? obj.set(key, value) : (obj[key] = value, obj);
}

/**
 * Removes given `key` from given object
 * @param  {Object|Map|Set} obj
 * @param  {String} key
 * @return {Object|Map|Set}
 */
export function remove(obj, key) {
	if (obj instanceof Map || obj instanceof Set) {
		obj.delete(key);
	} else if (typeof obj === 'object') {
		delete obj[key];
	}
	return obj;
}

/**
 * Get value from given ojbect by given deep (dot-separated) key
 * @param  {Object} obj
 * @param  {String} key
 * @return {any}
 */
export function deepGet(obj, key) {
    var parts = key.split('.');
    while (parts.length) {
        let key = parts.shift();
        if (obj && has(obj, key)) {
            obj = get(obj, key);
        } else {
            return undefined;
        }
    }

    return obj;
}

/**
 * Updates `key` value in given `obj` by creating new instances of intermediate
 * objects of deep `key`
 * @param  {Object} obj
 * @param  {String} key
 * @param  {any} value
 * @return {Object}
 */
export function deepSet(obj, key, value) {
	var parts = key.split('.');
	var lastKey = parts.pop();
	var result = copy(obj);
	var ctx = result;
	parts.forEach(k => {
		var inner = has(ctx, k) ? copy(get(ctx, k)) : {};
		set(ctx, k, inner);
		ctx = inner;
	});
	set(ctx, lastKey, value);
	return result;
}

/**
 * Creates a copy of given object
 * @param  {any} obj
 * @return {any}
 */
export function copy(obj) {
	if (Array.isArray(obj)) {
		return obj.slice();
	}

	if (obj instanceof Map) {
		return new Map(obj);
	}

	if (obj instanceof Set) {
		return new Set(obj);
	}

	if (obj && typeof obj === 'object') {
		return {...obj};
	}

	return obj;
}

/**
 * Call given `fn` function on each value of given object
 * @param  {Object|Map|Set|Array}   obj
 * @param  {Function} fn
 */
export function iterate(obj, fn) {
    if (obj instanceof Map || obj instanceof Set || Array.isArray(obj)) {
        obj.forEach(fn);
    } else if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => fn(obj[key], key));
    }
}

/**
 * Check if two sets are identical
 * @param  {Set}  a
 * @param  {Set}  b
 * @return {Boolean}
 */
export function isSameSet(a, b) {
    if (a === b) {
        return true;
    }

    if (!(a instanceof Set) || !(b instanceof Set) || a.size !== b.size) {
        return false;
    }

	for (let val of a) {
		if (!b.has(val)) {
			return false;
		}
	}

	return true;
}

/**
 * Cehck if two maps are identical
 * @param  {Map}  a
 * @param  {Map}  b
 * @return {Boolean}
 */
export function isSameMap(a, b) {
	if (a === b) {
        return true;
    }

    if (!(a instanceof Map) || !(b instanceof Map) || a.size !== b.size) {
        return false;
    }

	for (let [key, val] of a) {
		if (!b.has(key) || b.get(key) !== val) {
			return false;
		}
	}

	return true;
}

/**
 * Returns normalized URL that can be used as a key in store
 * @param  {String} url
 * @return {String}
 */
export function normalizeUrl(url) {
    return url.replace(/#.*$/, '');
}

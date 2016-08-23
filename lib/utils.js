'use strict';

/**
 * Check if given object or map contains `key`
 * @param  {Object|Map}  obj
 * @param  {String}  key
 * @return {Boolean}
 */
export function has(obj, key) {
	if (obj == null) {
		return false;
	}

	return obj instanceof Map ? obj.has(key) : key in obj;
}

/**
 * Check if given object contains given value
 * @param  {Object|Map|Set|Array}  obj
 * @param  {String}  value
 * @return {Boolean}
 */
export function hasValue(obj, value) {
	if (Array.isArray(obj)) {
		return obj.indexOf(value) !== -1;
	}
	if (obj instanceof Map) {
		for (let v of obj.values()) {
			if (v === value) {
				return true;
			}
		}
		return false;
	}

	if (obj instanceof Set) {
		return obj.has(value);
	}

	if (obj && typeof obj === 'object') {
		return Object.keys(obj).some(key => obj[key] === value);
	}

	return false;
}

/**
 * Get `key` value from given object or map
 * @param  {Object|Map} obj
 * @param  {String} key
 * @return {any}
 */
export function get(obj, key) {
	if (obj == null) {
		return undefined;
	}
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
 * Returns array of keys of given Map or object
 * @param  {Map|Object} obj
 * @return {Array}
 */
export function keys(obj) {
	return obj instanceof Map ? Array.from(obj.keys()) : Object.keys(obj);
}

/**
 * Get value from given object by given deep (dot-separated) key
 * @param  {Object} obj
 * @param  {Array|String} key
 * @return {any}
 */
export function deepGet(obj, key) {
    var parts = Array.isArray(key) ? key.slice() : key.split('.');
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
 * @param  {Array|String} key
 * @param  {any} value
 * @return {Object}
 */
export function deepSet(obj, key, value) {
	var parts = Array.isArray(key) ? key.slice() : key.split('.');
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
		// [].concat(arr) seems to be faster than arr.slice()
		return [].concat(obj);
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
 * Returns normalized URL that can be used as a key in store
 * @param  {String} url
 * @return {String}
 */
export function normalizeUrl(url) {
    return typeof url === 'string' ? url.replace(/#.*$/, '') : url;
}

export function makeArray(obj) {
	return obj instanceof Set ? Array.from(obj) : obj;
}

export function makeMap(obj) {
	if (obj instanceof Map) {
		return obj;
	}

	if (!obj) {
		return new Map();
	}

	return Object.keys(obj).reduce((out, key) => out.set(key, obj[key]), new Map());
}

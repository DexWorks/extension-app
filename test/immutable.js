'use strict';

const assert = require('assert');
require('babel-register');
const immutable = require('../lib/immutable').default;

describe('Immutable', () => {
	it('get', () => {
		var obj = {
			a: {b: 1},
			c: {d: {e: 2}},
			f: {g: {h: 3}, j: {k: 4}}
		};
		var im = immutable(freeze(obj));

		assert.equal(im.get('a'), obj.a);
		assert.equal(im.get('c.d.e'), 2);
		assert.equal(im.get('c.d.f'), undefined);
		assert.equal(im.get('c.d1.f'), undefined);
		assert.equal(im.get('c1.d1.f1'), undefined);
		assert.equal(im.get('s'), undefined);
		assert.equal(im.get('f.j.k'), 4);
		assert(!im.updated);
		assert.equal(im.value, obj);
	});

	it('set', () => {
		var obj = {
			a: {b: 1},
			c: {d: {e: 2}},
			f: {g: {h: 3}, j: {k: 4}}
		};
		var im = immutable(freeze(obj));

		im.set('a.b', 10);
		assert.equal(im.get('a.b'), 10);
		assert.notEqual(im.get('a'), obj.a);
		assert.notEqual(im.get('a.b'), obj.a.b);
		assert.equal(im.get('c'), obj.c);
		assert.equal(im.get('c.d'), obj.c.d);
		assert.equal(im.get('f'), obj.f);

		im.set('f.g.h2.j.k', 20);
		assert.equal(im.get('f.g.h2.j.k'), 20);
		assert.equal(im.get('c'), obj.c);

		im.set('foo.bar', 'baz');
		assert.equal(im.get('foo.bar'), 'baz');
		assert.notEqual(im.get('a'), obj.a);
		assert.equal(im.get('c'), obj.c);

		// do not re-create object during session
		let old = im.get('foo');
		im.set('foo.bar', 'bak');
		assert.equal(im.get('foo.bar'), 'bak');
		assert.equal(im.get('foo'), old);

		let oldF = im.get('f');
		let oldG = im.get('f.g');
		let oldH2 = im.get('f.g.h2');
		im.set('f.g.h2.j2.k', 22);
		assert.equal(im.get('f.g.h2.j2.k'), 22);
		assert.equal(im.get('f'), oldF);
		assert.equal(im.get('f.g'), oldG);
		assert.equal(im.get('f.g.h2'), oldH2);

		let oldValue = im.value;
		im.set('a', {b: 100});
		assert.equal(im.get('a.b'), 100);
		assert.equal(im.get('f'), oldF);
		assert.equal(im.value, oldValue);

		assert(im.updated);
	});

	it('delete', () => {
		var obj = {
			a: {b: 1},
			c: {d: {e: 2}},
			f: {g: {h: 3}, j: ['a', 'b', 'c']}
		};
		var im = immutable(freeze(obj));

		im.delete('c.d.e');
		assert.deepEqual(im.get('c.d'), {});

		im.delete('a');
		assert.deepEqual(Object.keys(im.value), ['c', 'f']);

		im.delete('f.j.1');
		assert.deepEqual(im.get('f.j'), ['a', 'c']);

		// deleting non-existing key
		im.delete('foo.bar.baz');
		assert.equal(im.get('foo'), undefined);
		im.delete('f.g.foo');


		// all other objects should remain as is
		assert.equal(im.get('f.g'), obj.f.g);
		assert.equal(im.get('f.g.h'), obj.f.g.h);
		assert.notEqual(im.get('f'), obj.f);

		assert(im.updated);
	});

	it('assign', () => {
		var obj = {
			a: {b: 1},
			c: {d: {e: 2}},
			f: {g: {h: 3}, j: {k: 4}}
		};
		var im = immutable(freeze(obj));

		im.assign('f.g', {h2: 23, h3: 33});
		assert.equal(im.get('f.g.h'), 3);
		assert.equal(im.get('f.g.h2'), 23);
		assert.equal(im.get('f.g.h3'), 33);
		assert.equal(im.get('a'), obj.a);
		assert.equal(im.get('c'), obj.c);
		assert(im.updated);
	});

	it('array', () => {
		var obj = {
			a: [
				{b: 1},
				{c: 2},
				{d: {e: 3}},
			]
		};
		var im = immutable(freeze(obj));

		im.set('a.1.c', 22);
		assert.equal(im.get('a.1.c'), 22);
		assert.equal(im.get('a.0.b'), 1);
		assert.equal(im.get('a.0'), obj.a[0]);
		assert.notEqual(im.get('a'), obj.a);
		assert.notEqual(im.get('a.1'), obj.a[1]);

		let oldArr = im.get('a');
		im.set('a.2.d.e', 33);
		assert.equal(im.get('a.2.d.e'), 33);
		assert.equal(im.get('a'), oldArr);

		assert(im.updated);

		obj = {
			a: [
				{b: 1},
				{c: 2},
				{d: 3},
			]
		};
		let val = {c2: 22};
		im = immutable(freeze(obj));
		oldArr = im.get('a');
		im.set('a.1', val);

		assert.notEqual(im.get('a'), oldArr);
		assert.equal(im.get('a.1'), val);
	});
});

/**
 * Recursively freeze object graph
 * @param  {Object} obj
 * @return {Object}
 */
function freeze(obj) {
	if (Array.isArray(obj)) {
		for (var i = 0; i < obj.length; i++) {
			obj[i] = freeze(obj[i]);
		}
	} else if (obj != null && typeof obj === 'object') {
		Object.keys(obj).forEach(k => obj[k] = freeze(obj[k]));
	}

	return Object.freeze(obj);
}

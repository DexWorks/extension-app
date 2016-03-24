'use strict';

const assert = require('assert');
require('babel-register');
const utils = require('../lib/utils');

describe('Utils', () => {
    it('get', () => {
        var obj1 = {foo: 'bar'};
        var obj2 = new Map().set('foo', 'bar');

        assert.equal(utils.get(obj1, 'foo'), 'bar');
        assert.equal(utils.get(obj2, 'foo'), 'bar');
    });

    it('set', () => {
        var obj1 = utils.set({foo: 'bar'}, 'foo', 'baz');
        var obj2 = utils.set(new Map().set('foo', 'bar'), 'foo', 'baz');

        assert.equal(utils.get(obj1, 'foo'), 'baz');
        assert.equal(utils.get(obj2, 'foo'), 'baz');
    });

    it('deep get', () => {
        var obj = {
			a: {
				b: new Map()
				.set('c', {d: 1, e: 'foo'})
			}
		};

        assert.equal(utils.deepGet(obj, 'a.b.c.e'), 'foo');
        assert.equal(utils.deepGet(obj, 'a10.b.c.e'), undefined);
        assert.equal(utils.deepGet(obj, 'a.b10.c.e'), undefined);
    });

    it('deep set', () => {
        var obj = {
			a1: {
				b1: new Map()
				.set('c1', {d1: 1, e1: 'foo'})
			},
			a2: {
				b2: new Map().set('c2', {d2: 1, e2: 'foo'}),
				b2_2: {c2_2: 'bar'}
			},
			a3: {
				b3: new Map().set('c3', {d3: 1, e3: 'foo'})
			}
		};

		var replaced = utils.deepSet(obj, 'a2.b2.c2.d2', 5);
		assert(obj !== replaced);
		assert(obj.a1 === replaced.a1);
		assert(obj.a1.b1 === replaced.a1.b1);
		assert(obj.a2 !== replaced.a2);
		assert(obj.a2.b2 !== replaced.a2.b2);
		assert(obj.a2.b2_2 === replaced.a2.b2_2);
		assert(obj.a2.b2.get('c2') !== replaced.a2.b2.get('c2'));
		assert(replaced.a2.b2.get('c2').d2 === 5);

		replaced = utils.deepSet(obj, 'a3', 'baz');
		assert(obj !== replaced);
		assert(obj.a1 === replaced.a1);
		assert(obj.a2 === replaced.a2);
		assert(obj.a1.b1 === replaced.a1.b1);
		assert(obj.a2.b2 === replaced.a2.b2);
		assert(replaced.a3 === 'baz');
    });

    it('is same set', () => {
        assert.equal(utils.isSameSet(new Set(['a', 'b']), new Set(['a', 'b'])), true);
        assert.equal(utils.isSameSet(new Set(['a', 'b']), new Set(['b', 'a'])), true);
        assert.equal(utils.isSameSet(new Set(['a', 'b']), new Set(['b', 'c', 'a'])), false);
        assert.equal(utils.isSameSet(['a', 'b'], new Set(['a', 'b'])), false);
    });
});

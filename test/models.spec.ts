import {expect} from './testlib';

import {KV, Label, Tags} from '@fp8proj';

class KVS extends KV<string> {}

class SimpleTags extends Tags<string> {}

class KVLabel extends KV<Tags<number>> {}

class StringLabel extends Tags<string> {}


describe('models', () => {
    it('simple KV', () => {
        const entry = new KVS('testKVS', 'pvyvhZyS63');
        expect(entry.toIJson()).to.eql({ testKVS: 'pvyvhZyS63' })
    });

    it('simple Label', () => {
        const entry = new Label('testLabel', 'bKutvGvLoa');
        expect(entry.toIJson()).to.eql({testLabel: 'bKutvGvLoa'})
    });

    it('SimpleTags', () => {
        const entry = new SimpleTags('testTags', '80qes03Ftr');
        expect(entry.toIJson()).to.eql({testTags: ['80qes03Ftr']})

        const entry2 = new SimpleTags('testTags2', 'WL5oW2Vhll', 'WL5oW2Vhll');
        expect(entry2.toIJson()).to.eql({testTags2: ['WL5oW2Vhll', 'WL5oW2Vhll']})
    });

    it('simple KVLabel', () => {
        const entry = new KVLabel('testKVLabel', new Tags('testLabel', 8090, 6860));
        expect(entry.toIJson()).to.eql({ testKVLabel: {testLabel: [8090, 6860]} });
    });

    it('simple StringLabel', () => {
        const entry = new StringLabel('testStringLabel', 'dDVfo39D3f', 'HCJejdQNBT');
        expect(entry.toIJson()).to.eql({ testStringLabel: ['dDVfo39D3f', 'HCJejdQNBT'] });
    });

    it('merge kvs simple', () => {
        const kvs = [
            new KVS('testKVS', 'UyjlxKJXUN'),
            new Label('testLabel', 'JuSyAWXhZ7'),
            new SimpleTags('testTags', 'XKx4IHlWmH')
        ];

        const merged = KV.merge(...kvs);
        expect(merged).is.eql({
            testKVS: 'UyjlxKJXUN',
            testLabel: 'JuSyAWXhZ7',
            testTags: [ 'XKx4IHlWmH' ]
        });
    });

    it('merge kvs merge key', () => {
        const kvs = [
            new KVS('key1', 'Ex8roHjRct'),
            new Label('key2', 'hu60CM6WgB'),
            new SimpleTags('key1', '5WGjFwxdCZ')
        ];

        const merged = KV.merge(...kvs);
        expect(merged).is.eql({
            key1: [ '5WGjFwxdCZ' ],
            key2: 'hu60CM6WgB',
        });
    });

    it('merge kvs merge value', () => {
        const kvs = [
            new KVS('key1', '0iu7dUwEE6'),
            new Label('key2', 'xV49Qdk17g'),
            new SimpleTags('key1', 'WDlBAwENwK')
        ];

        const merged = KV.mergeValue(...kvs);
        expect(merged).is.eql({
            key1: [ '0iu7dUwEE6', 'WDlBAwENwK' ],
            key2: 'xV49Qdk17g',
        });
    });

});

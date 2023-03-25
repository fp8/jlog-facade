import {expect} from './testlib';

import {KV, Label, Tags, Loggable} from '@fp8proj';

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
        const entry = Label.of('testLabel', 'bKutvGvLoa');
        expect(entry.toIJson()).to.eql({testLabel: 'bKutvGvLoa'})
    });

    it('SimpleTags', () => {
        const entry = new SimpleTags('testTags', '80qes03Ftr');
        expect(entry.toIJson()).to.eql({testTags: ['80qes03Ftr']})

        const entry2 = SimpleTags.of('testTags2', 'WL5oW2Vhll', 'WL5oW2Vhll');
        expect(entry2.toIJson()).to.eql({testTags2: ['WL5oW2Vhll', 'WL5oW2Vhll']})
    });

    it('simple KVLabel', () => {
        const entry = new KVLabel('testKVLabel', Tags.of('testLabel', 8090, 6860));
        expect(entry.toIJson()).to.eql({ testKVLabel: {testLabel: [8090, 6860]} });
    });

    it('simple StringLabel', () => {
        const entry = new StringLabel('testStringLabel', 'dDVfo39D3f', 'HCJejdQNBT');
        expect(entry.toIJson()).to.eql({ testStringLabel: ['dDVfo39D3f', 'HCJejdQNBT'] });
    });

    it('simple Loggable', () => {
        const entry = Loggable.of('testLoggable', {today: new Date('2023-03-24'), weekday: 'FRI'});
        expect(entry.toIJson()).to.eql({
            testLoggable: {
                today: '2023-03-24T00:00:00.000Z',
                weekday: 'FRI'
            }
        });
    });

    it('error Loggable', () => {
        const entry = Loggable.of('testLoggable', {orders: BigInt('123')});
        expect(entry.toIJson()).to.eql({
            testLoggable: '[object Object]'
        });
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
            KVS.of('key1', '0iu7dUwEE6'),
            Label.of('key2', 'xV49Qdk17g'),
            SimpleTags.of('key1', 'WDlBAwENwK')
        ];

        const merged = KV.mergeValue(...kvs);
        expect(merged).is.eql({
            key1: [ '0iu7dUwEE6', 'WDlBAwENwK' ],
            key2: 'xV49Qdk17g',
        });
    });

});

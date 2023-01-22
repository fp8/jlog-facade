import {expect} from './testlib';

import {IJson, KV, Tags} from '@fp8proj';

class KVS extends KV<string> {}

class KVLabel extends KV<Tags<number>> {}

class StringLabel extends Tags<string> {}


describe('models', () => {
    it('simple KV', () => {
        const entry = new KVS('testKVS', 'pvyvhZyS63');
        expect(entry.toIJson()).to.eql({ testKVS: 'pvyvhZyS63' })
    });

    it('simple KVLabel', () => {
        const entry = new KVLabel('testKVLabel', new Tags('testLabel', 8090, 6860));
        expect(entry.toIJson()).to.eql({ testKVLabel: {testLabel: [8090, 6860]} });
    });

    it('simple StringLabel', () => {
        const entry = new StringLabel('testStringLabel', 'dDVfo39D3f', 'HCJejdQNBT');
        expect(entry.toIJson()).to.eql({ testStringLabel: ['dDVfo39D3f', 'HCJejdQNBT'] });
    });

});

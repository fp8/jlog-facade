import {expect} from './testlib';

import {
    LogLevel,
    convertSeverityToLevel,
    convertValueToIJson
} from '@fp8proj/core';

import {KV} from '@fp8proj/models';

describe('core', () => {
    it('convertSeverityToLevel', () => {
        expect(convertSeverityToLevel('info')).to.eql(LogLevel.INFO);
        expect(convertSeverityToLevel('off')).to.eql(LogLevel.OFF);
        expect(convertSeverityToLevel('invalid')).to.be.undefined;
    });

    it('convertValueToIJson', () => {
        const data = {
            one: 1
        };
        const kv = KV.of('two', '2');
        const entry = convertValueToIJson([data, kv]);

        // console.log(JSON.stringify(entry));
        expect(entry).to.eql([{"one":1},{"two":"2"}]);
    });
});
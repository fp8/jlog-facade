import {expect} from './testlib';
import { createHash } from 'crypto';
import {
    LogLevel,
    convertToJsonValue,
    convertSeverityToLevel,
    convertLoggableValueToIJson,
    maskSecret
} from '@fp8proj/core';

import {KV} from '@fp8proj/models';

describe('core', () => {
    it('convertSeverityToLevel', () => {
        expect(convertSeverityToLevel('info')).to.eql(LogLevel.INFO);
        expect(convertSeverityToLevel('off')).to.eql(LogLevel.OFF);
        expect(convertSeverityToLevel('invalid')).to.be.undefined;
    });

    it('convertLoggableValueToIJson - simple', () => {
        const data = {
            one: 1
        };
        const kv = KV.of('two', '2');
        const entry = convertLoggableValueToIJson([data, kv]);

        // console.log(JSON.stringify(entry));
        expect(entry).to.eql([{"one":1},{"two":"2"}]);
    });

    it('convertToJsonValue - simple', () => {
        const data = {
            str: 'abc',
            instances: [1, 2, 3],
            orders: 123,
            large: 456
        };

        const entry: any = convertToJsonValue(data);
        expect(entry).not.to.be.undefined;
        expect(entry!.str).to.eql('abc');
        expect(entry!.instances).to.eql([1, 2, 3]);
        expect(entry!.orders).to.eql(123);
        expect(entry!.large).to.eql(456);
    });

    it('convertToJsonValue - object', () => {
        const data = {
            today: new Date('2023-03-25'),
            str: String('abc'),
            instances: [1, 2, 3],
            orders: Number('123'),
            large: 456
        };

        const entry: any = convertToJsonValue(data);
        // console.log(JSON.stringify(entry));
        expect(entry).not.to.be.undefined;

        expect(entry!.today).to.eql('2023-03-25T00:00:00.000Z');
        expect(entry!.str).to.eql('abc');
        expect(entry!.instances).to.eql([1, 2, 3]);
        expect(entry!.orders).to.eql(123);
        expect(entry!.large).to.eql(456);
    });


    it('convertToJsonValue - cant convert to json', () => {
        // BigInt cannot be parse to json
        const data = {
            today: new Date('2023-03-25'),
            str: String('abc'),
            instances: [1, 2, 3],
            orders: Number('123'),
            large: BigInt('456')
        };

        const entry = convertToJsonValue(data);

        console.log(JSON.stringify(entry));

        expect(entry).not.to.be.undefined;
        expect(entry).to.eql('[object Object]');
    });

    it('maskSecret less than 12 char', () => {
        const secret = 'secret';
        const res = maskSecret(secret);
        
        const expected = 'K7gN...qoVW';
        
        expect(res).to.equal(expected);
    });

    it('maskSecret with force enabled', () => {
        const secret = 'secret-length-more-than-twelve-char';
        const res = maskSecret(secret,true);
        
        const expected = '5jQt...RclM';
        
        expect(res).to.equal(expected);
    });

    it('maskSecret more than 12 char', () => {
        const secret = 'secret-twelve';
        const res = maskSecret(secret);
        
        const expected = 'secr...elve';
        
        expect(res).to.equal(expected);
    });
});
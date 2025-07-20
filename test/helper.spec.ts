import { expect } from './testlib';
import { maskSecret } from '@fp8proj/helper';

import {
    isEmpty, isNotEmpty, localDebug
} from '@fp8proj/helper';

interface ITestResponse {
    status?: 'OK' | 'KO';
}

describe('helper', () => {
    it('isEmpty', () => {
        expect(isEmpty(undefined)).to.be.true;
        expect(isEmpty(null)).to.be.true;
        expect(isEmpty({})).to.be.true;
        expect(isEmpty([])).to.be.true;
        expect(isEmpty('')).to.be.true;
        expect(isEmpty(Buffer.alloc(0))).to.be.true;
        
        expect(isEmpty({a:1})).to.be.false;
        expect(isEmpty([1])).to.be.false;
        expect(isEmpty(new Date())).to.be.false;
        expect(isEmpty(' ')).to.be.false;
        expect(isEmpty(Buffer.from('test'))).to.be.false;
        expect(isEmpty(Buffer.alloc(5))).to.be.false;

        // Boolean are never empty
        expect(isEmpty(false)).to.be.false;
        expect(isEmpty(true)).to.be.false;
    });

    it('isNotEmpty', () => {
        expect(isNotEmpty(undefined)).to.be.false;
        expect(isNotEmpty(null)).to.be.false;
        expect(isNotEmpty({})).to.be.false;
        expect(isNotEmpty([])).to.be.false;
        expect(isNotEmpty('')).to.be.false;
        expect(isNotEmpty(Buffer.alloc(0))).to.be.false;

        expect(isNotEmpty({a:1})).to.be.true;
        expect(isNotEmpty([1])).to.be.true;
        expect(isNotEmpty(new Date())).to.be.true;
        expect(isNotEmpty(' ')).to.be.true;
        expect(isNotEmpty(Buffer.from('test'))).to.be.true;
        expect(isNotEmpty(Buffer.alloc(5))).to.be.true;

        // Boolean are never empty
        expect(isNotEmpty(false)).to.be.true;
        expect(isNotEmpty(true)).to.be.true;
    });

    it('isNotEmpty - TypeGuard', () => {
        const input: ITestResponse | undefined = { status: 'OK' };
        if (isNotEmpty(input)) {
            expect(input.status).to.equal('OK');
        } else {
            expect.fail('Expected input to be not empty');
        }

        const emptyInput: ITestResponse | undefined = undefined;
        if (isNotEmpty(emptyInput)) {
            expect.fail('Expected emptyInput to be empty');
        } else {
            expect(emptyInput).to.be.undefined;
        }
    })

    it('test debug -- Should not throw error', () => {
        const data = '{"bad":12';
        localDebug(() => `Test: ${JSON.stringify(JSON.parse(data))}`);
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

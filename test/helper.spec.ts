import { expect } from './testlib';

import {
    isEmpty, localDebug
} from '@fp8proj/helper';

describe('helper', () => {
    it('isEmpty', () => {
        expect(isEmpty(undefined)).to.be.true;
        expect(isEmpty(null)).to.be.true;
        expect(isEmpty({})).to.be.true;
        expect(isEmpty([])).to.be.true;
        expect(isEmpty('')).to.be.true;
        
        expect(isEmpty({a:1})).to.be.false;
        expect(isEmpty([1])).to.be.false;
        expect(isEmpty(new Date())).to.be.false;
        expect(isEmpty(' ')).to.be.false;

        // Boolean are never empty
        expect(isEmpty(false)).to.be.false;
        expect(isEmpty(true)).to.be.false;
    });

    it('test debug -- Should not throw error', () => {
        const data = '{"bad":12';
        localDebug(() => `Test: ${JSON.stringify(JSON.parse(data))}`);
    });
});

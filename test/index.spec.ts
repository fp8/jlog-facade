import {expect} from './testlib';
import {IsNull} from '@fp8proj';

describe('Helper', () => {
    it('IsNull', () => {
        expect(IsNull(null)).to.be.true;
    });
});

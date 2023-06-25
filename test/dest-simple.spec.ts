import {
    LoggerFactory
} from "@fp8proj";

import {LogWriter} from '@fp8proj/writer';

import {
    expect,
    TestSimpleJsonDestination, logCollector, clearLogCollector
} from "./testlib";



describe('dest-filter', () => {
    const writer = LogWriter.getInstance();
    const logger = LoggerFactory.create('logger-X5TzJmYtHV');

    before(() => {
        writer._reloadConfig('simple');
    });

    after(() => {
        writer._reloadConfig();
    });

    beforeEach(() => {
        LoggerFactory.clearLogDestination();
        clearLogCollector();
        TestSimpleJsonDestination.use();
    });

    it('from config error log', () => {
        logger.error('error C3nMRY8kHm');


        expect(logCollector).to.eql([
            '{"m":"E|error C3nMRY8kHm","environment":"dev-TaSG6Fpj1R"}'
        ]);
    });

    it('from config warn log', () => {
        logger.panic('logge panic C3nMRY8kHm');
        expect(logCollector).to.eql([
            '{"m":"P|logge panic C3nMRY8kHm","environment":"dev-TaSG6Fpj1R"}'
        ]);
    });

});

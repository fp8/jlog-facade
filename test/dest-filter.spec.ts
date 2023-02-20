import {
    LoggerFactory, LogLevel
} from "@fp8proj";

import {useDestination} from '@fp8proj/dest';
import {LogWriter} from '@fp8proj/writer';

import {
    expect,
    TestSimpleTextDestination, logCollector, clearLogCollector
} from "./testlib";

class TestWarnTextDestination extends TestSimpleTextDestination {
    static use(level?: string | LogLevel, ...filters: string[]): TestWarnTextDestination {
        return useDestination(TestWarnTextDestination, level, filters);
    }
}

describe.only('dest-filter', () => {
    const writer = LogWriter.getInstance();
    const loggerA = LoggerFactory.create('loggerA');
    const loggerB = LoggerFactory.create('loggerB');
    const loggerC = LoggerFactory.create('loggerB.extended');

    before(() => {
        writer._reloadConfig('dest-filter');
    });

    after(() => {
        writer._reloadConfig();
    });

    beforeEach(() => {
        LoggerFactory.clearLogDestination();
        clearLogCollector();
        TestSimpleTextDestination.use();
        TestWarnTextDestination.use();
    });

    it('from config info log', () => {
        loggerA.info('loggerA info IBCDEFLPFa');
        loggerB.info('loggerB info IBCDEFLPFa');
        loggerC.info('loggerC info IBCDEFLPFa');
        expect(logCollector).to.eql([
            '|I loggerA info IBCDEFLPFa'
        ]);
    });

    it('from config warn log', () => {
        loggerA.warn('loggerA warn q1uXqyMhaG');
        loggerB.warn('loggerB warn q1uXqyMhaG');
        loggerC.warn('loggerC warn q1uXqyMhaG');
        expect(logCollector).to.eql([
            '|W loggerA warn q1uXqyMhaG',
            '|W loggerB warn q1uXqyMhaG',
            '|W loggerC warn q1uXqyMhaG'
        ]);
    });
});

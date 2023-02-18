import {
    IJLogEntry, KV, LoggerFactory,
    ISimpleJsonOutput, SimpleTextDestination, SimpleJsonDestination, LogLevel
} from "@fp8proj";
import { expect } from "chai";

let logCollector: string[] = [];
class TestSimpleTextDestination extends SimpleTextDestination {
    override _write(entry: IJLogEntry): void {
        const result = this.formatOutput(entry);
        console.log(result);

        // Delete the timestamp from collected log as it can't be tested
        const splitAt = result.indexOf('|');
        if (splitAt) {
            logCollector.push(result.substring(splitAt));
        } else {
            logCollector.push(result);
        }
    }
}

class TestSimpleJsonDestination extends SimpleJsonDestination {
    override _write(entry: IJLogEntry): void {
        const result = this.formatOutput(entry);
        console.log(JSON.stringify(result));

        // Delete the timestamp from collected log as it can't be tested
        const collect: Omit<ISimpleJsonOutput, 't'> = result;
        delete collect.t;
        logCollector.push(JSON.stringify(collect));
    }
}

describe('dest', () => {
    const logger = LoggerFactory.create('my-logger');

    beforeEach(() => {
        LoggerFactory.clearLogDestination();
        logCollector = [];
    });

    it('text - simple info', () => {
        LoggerFactory.addLogDestination(new TestSimpleTextDestination());
        logger.info('This is message for 9xeyQ0ikKe');
        expect(logCollector).is.eql(['|I This is message for 9xeyQ0ikKe']);
    });

    it('text - simple error', () => {
        LoggerFactory.addLogDestination(new TestSimpleTextDestination());
        const error = new Error('lwi3U0CyET is bad');
        logger.error(error);
        expect(logCollector).is.eql(['|E lwi3U0CyET is bad']);
    });

    it('text - simple error with message', () => {
        LoggerFactory.addLogDestination(new TestSimpleTextDestination());
        const error = new Error('WryAUrSVas failed');
        logger.error('WryAUrSVas process did not work', error);
        expect(logCollector).is.eql(['|E WryAUrSVas process did not work [Error:WryAUrSVas failed]']);
    });

    it('text - warn with payload', () => {
        LoggerFactory.addLogDestination(new TestSimpleTextDestination());
        logger.warn('This is warning of k2haHZGtKy', new KV('entry', 'NmAlwOI6D7'));
        expect(logCollector).is.eql([ '|W This is warning of k2haHZGtKy {"entry":"NmAlwOI6D7"}' ]);
    });

    it('json - simple debug', () => {
        LoggerFactory.addLogDestination(new TestSimpleJsonDestination(LogLevel.DEBUG));
        logger.debug('Debug message for VnFdNvbyTq');
        expect(logCollector).is.eql(['{"m":"D|Debug message for VnFdNvbyTq"}']);
    });

    it('json - info with payload', () => {
        LoggerFactory.addLogDestination(new TestSimpleJsonDestination());
        logger.info('Info message for UurqWHYMyJ', new KV('processId', 'UurqWHYMyJ'));
        expect(logCollector).is.eql(['{"m":"I|Info message for UurqWHYMyJ","processId":"UurqWHYMyJ"}']);
    });

    it('json - error', () => {
        LoggerFactory.addLogDestination(new TestSimpleJsonDestination(LogLevel.INFO, false));
        const error = new Error('vOGQbtxvfD');
        logger.error(error);
        expect(logCollector).is.eql(['{"m":"E|vOGQbtxvfD","e":"Error: vOGQbtxvfD"}']);
    });

    it('json - error with stack', () => {
        LoggerFactory.addLogDestination(new TestSimpleJsonDestination());
        const error = new Error('qbsKviHUSV');
        logger.warn('qbsKviHUSV did not work', error);

        expect(logCollector.length).is.eql(1);

        const json = JSON.parse(logCollector[0]);
        expect(json.m).is.eql('W|qbsKviHUSV did not work');
        expect(json.e).is.eql('Error: qbsKviHUSV');
        expect(json.s).satisfies((message: string) => message.startsWith('Error: qbsKviHUSV'));
    });

    it('json - LogLevel INFO', () => {
        LoggerFactory.addLogDestination(new TestSimpleJsonDestination(LogLevel.WARNING));

        logger.debug('Debug message for bCp3NvdMko');
        expect(logCollector).is.eql([]);
        logger.info('Info message for bCp3NvdMko');
        expect(logCollector).is.eql([]);
        
        logger.warn('Warn message for bCp3NvdMko');
        expect(logCollector).is.eql(['{"m":"W|Warn message for bCp3NvdMko"}']);

        logger.error('Error message for bCp3NvdMko');
        expect(logCollector).is.eql([
            '{"m":"W|Warn message for bCp3NvdMko"}',
            '{"m":"E|Error message for bCp3NvdMko"}'
        ]);

        logger.panic('Panic message for bCp3NvdMko');
        expect(logCollector).is.eql([
            '{"m":"W|Warn message for bCp3NvdMko"}',
            '{"m":"E|Error message for bCp3NvdMko"}',
            '{"m":"P|Panic message for bCp3NvdMko"}'
        ]);

    });

    it('json - LogLevel PANIC', () => {
        LoggerFactory.addLogDestination(new TestSimpleJsonDestination(LogLevel.PANIC));

        logger.debug('Debug message for fYKShPyBvI');
        expect(logCollector).is.eql([]);
        logger.info('Info message for fYKShPyBvI');
        expect(logCollector).is.eql([]);
        logger.warn('Warn message for fYKShPyBvI');
        expect(logCollector).is.eql([]);
        logger.error('Error message for fYKShPyBvI');
        expect(logCollector).is.eql([]);

        logger.panic('Panic message for fYKShPyBvI');
        expect(logCollector).is.eql([
            '{"m":"P|Panic message for fYKShPyBvI"}'
        ]);
    });

});
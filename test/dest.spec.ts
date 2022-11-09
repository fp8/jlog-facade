import {
    IJLogEntry, KV, LoggerFactory,
    ISimpleJsonOutput, SimpleTextDestination, SimpleJsonDestination
} from "@fp8proj";
import { expect } from "chai";

let logCollector: string[] = [];
class TestSimpleTextDestination extends SimpleTextDestination {
    override write(entry: IJLogEntry): void {
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
    override write(entry: IJLogEntry): void {
        const result = this.formatOutput(entry);
        console.log(JSON.stringify(result));

        // Delete the timestamp from collected log as it can't be tested
        const collect: Omit<ISimpleJsonOutput, 't'> = result;
        delete collect.t;
        logCollector.push(JSON.stringify(collect));
    }
}



describe.only('dest', () => {
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
        LoggerFactory.addLogDestination(new TestSimpleJsonDestination());
        logger.debug('Debug message for VnFdNvbyTq');
        expect(logCollector).is.eql(['{"m":"D|Debug message for VnFdNvbyTq"}']);
    });

    it('json - info with payload', () => {
        LoggerFactory.addLogDestination(new TestSimpleJsonDestination());
        logger.info('Info message for UurqWHYMyJ', new KV('processId', 'UurqWHYMyJ'));
        expect(logCollector).is.eql(['{"m":"I|Info message for UurqWHYMyJ","processId":"UurqWHYMyJ"}']);
    });

    it.only('json - error', () => {
        LoggerFactory.addLogDestination(new TestSimpleJsonDestination(false));
        const error = new Error('vOGQbtxvfD');
        logger.error(error);
        expect(logCollector).is.eql(['{"m":"E|vOGQbtxvfD","e":"Error: vOGQbtxvfD"}']);
    });

    it.only('json - error with stack', () => {
        LoggerFactory.addLogDestination(new TestSimpleJsonDestination());
        const error = new Error('qbsKviHUSV');
        logger.warn('qbsKviHUSV did not work', error);

        expect(logCollector.length).is.eql(1);

        const json = JSON.parse(logCollector[0]);
        expect(json.m).is.eql('W|qbsKviHUSV did not work');
        expect(json.e).is.eql('Error: qbsKviHUSV');
        expect(json.s).satisfies((message: string) => message.startsWith('Error: qbsKviHUSV'));
    });

});
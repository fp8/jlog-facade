import { expect } from './testlib';

import { Writable } from 'stream';

import {
    IJLogEntry, LoggerFactory,
    AbstractLogDestination, AbstractAsyncLogDestination,
    KV
} from '@fp8proj';
import {LogWriter} from '@fp8proj/writer';

let logCollector: string[] = [];
let entryCollector: IJLogEntry[] = [];

function addToLogCollector(source: string, entry: IJLogEntry) {
    let message = `${source}-${entry.severity}`;

    if (entry.message !== undefined) {
        message = `${message}: ${entry.message}`
    }

    logCollector.push(message);
    entryCollector.push(entry);
}

class TestDestination extends AbstractLogDestination {
    write(entry: IJLogEntry): void {
        addToLogCollector('SYNC', entry);
        console.log('TestDestination: ', JSON.stringify(entry));
    }
}

class TestAsyncDestination extends AbstractAsyncLogDestination {
    async write(entry: IJLogEntry): Promise<void> {
        return new Promise((resolve, _) => {
            setTimeout(() => {
                addToLogCollector('ASYNC', entry);
                console.log('TestAsyncDestination: ', JSON.stringify(entry));
                resolve();
            }, 200);
        });
    }
}

class TestLogStream extends Writable {
    constructor() {
        super({objectMode: true});
    }
    override _write(chunk: IJLogEntry, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        addToLogCollector('STREAM', chunk);
        console.log('TestLogStream: ', JSON.stringify(chunk));
    }
}

describe('logger', () => {
    const dest = LogWriter.getInstance();
    const logger = LoggerFactory.create('test-logger');

    beforeEach(() => {
        dest.clearDestinations();
        logCollector = [];
        entryCollector = [];
    });

    it('no log', () => {
        logger.info('q9MyfvCGwd');
        expect(logCollector).to.eql([]);
    });

    it('debug log', () => {
        dest.addDestination(new TestDestination());
        logger.debug('FAySD0HVfS');
        expect(logCollector).to.eql(['SYNC-debug: FAySD0HVfS']);
    });

    it('info async log', async () => {
        dest.addDestination(new TestAsyncDestination());
        logger.info('lH37czD9jC')
        await logger.hasLogCompleted();
        expect(logCollector).to.eql(['ASYNC-info: lH37czD9jC']);
    });

    it('warn stream log', async () => {
        dest.addDestination(new TestLogStream());
        logger.warn('kuh3lp3WVj')
        await logger.hasLogCompleted();
        expect(logCollector).to.eql(['STREAM-warn: kuh3lp3WVj']);
    });

    it('3 destinations with LoggerFactory', async () => {
        // Step 1: add 3 destinations
        LoggerFactory.addLogDestination(new TestDestination(), 'sync');
        LoggerFactory.addLogDestination(new TestAsyncDestination(), 'async');
        LoggerFactory.addLogDestination(new TestLogStream(), 'stream');
        logger.error('uxqEbnCXeZ');

        await logger.hasLogCompleted();
        expect(logCollector).to.eql([
            'SYNC-error: uxqEbnCXeZ', 'STREAM-error: uxqEbnCXeZ', 'ASYNC-error: uxqEbnCXeZ'
        ]);

        // Step 2: remove one destination
        logCollector = [];

        LoggerFactory.removeLogDestination('stream');
        logger.panic('6gaabROqBx');
        await logger.hasLogCompleted();
        expect(logCollector).to.eql([
            'SYNC-panic: 6gaabROqBx', 'ASYNC-panic: 6gaabROqBx'
        ]);

        // Note: clear destination is already as it's used in beforeEach 
    });

    it('Test Error', () => {
        dest.addDestination(new TestDestination());
        const error = new Error('CFYlQXcdGf'); 
        logger.error(error);

        expect(entryCollector.length).is.eql(1);
        const entry = entryCollector[0];

        expect(entry.severity).is.eql('error');
        expect(entry.level).is.eql(500);
        expect(entry.message).is.eql('CFYlQXcdGf');
        expect(entry.error).is.equal(error);
    });

    it('Test KV', () => {
        dest.addDestination(new TestDestination());
        const kv = new KV('key-k6HraLIn8I', 'k6HraLIn8I'); 
        logger.info('v8aNlgLIfi', kv);

        expect(entryCollector.length).is.eql(1);
        const entry = entryCollector[0];

        expect(entry.severity).is.eql('info');
        expect(entry.level).is.eql(200);
        expect(entry.message).is.eql('v8aNlgLIfi');
        expect(entry.error).is.undefined;
        expect(entry.data['key-k6HraLIn8I']).is.eql('k6HraLIn8I');
    });

});

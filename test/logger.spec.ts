import { expect } from './testlib';
import { Writable } from 'stream';

import {
    IJLogEntry, LoggerFactory,
    AbstractLogDestination, AbstractAsyncLogDestination,
    KV, Label
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
        await logger.logWritten();
        expect(logCollector).to.eql(['ASYNC-info: lH37czD9jC']);
    });

    it('warn stream log', async () => {
        dest.addDestination(new TestLogStream());
        logger.warn('kuh3lp3WVj')
        await logger.logWritten();
        expect(logCollector).to.eql(['STREAM-warn: kuh3lp3WVj']);
    });

    it('3 destinations with LoggerFactory', async () => {
        // Step 1: add 3 destinations
        LoggerFactory.addLogDestination(new TestDestination(), 'sync');
        LoggerFactory.addLogDestination(new TestAsyncDestination(), 'async');
        LoggerFactory.addLogDestination(new TestLogStream(), 'stream');
        logger.error('uxqEbnCXeZ');

        await logger.logWritten();
        expect(logCollector).to.eql([
            'SYNC-error: uxqEbnCXeZ', 'STREAM-error: uxqEbnCXeZ', 'ASYNC-error: uxqEbnCXeZ'
        ]);

        // Step 2: remove one destination
        logCollector = [];

        LoggerFactory.removeLogDestination('stream');
        logger.panic('6gaabROqBx');
        await logger.logWritten();
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

    it('Test IJson', () => {
        dest.addDestination(new TestDestination());
        logger.info('IJson log', {key_ycUrTEToWP: 'ycUrTEToWP'});

        expect(entryCollector.length).is.eql(1);
        const entry = entryCollector[0];

        expect(entry.severity).is.eql('info');
        expect(entry.level).is.eql(200);
        expect(entry.message).is.eql('IJson log');
        expect(entry.error).is.undefined;
        expect(entry.data?.key_ycUrTEToWP).is.eql('ycUrTEToWP');
    });

    it('Test KV', () => {
        dest.addDestination(new TestDestination());
        const kv = new KV('key_k6HraLIn8I', 'k6HraLIn8I'); 
        logger.info('v8aNlgLIfi', kv);

        expect(entryCollector.length).is.eql(1);
        const entry = entryCollector[0];

        expect(entry.severity).is.eql('info');
        expect(entry.level).is.eql(200);
        expect(entry.message).is.eql('v8aNlgLIfi');
        expect(entry.error).is.undefined;
        expect(entry.data?.key_k6HraLIn8I).is.eql('k6HraLIn8I');
    });

    it('Test KV nested', () => {
        dest.addDestination(new TestDestination());
        const kv = new KV('key_Tg3YEpbkkD', 'Tg3YEpbkkD'); 
        logger.info('nDu4wXyXZq', new KV('nestedKey', kv));

        expect(entryCollector.length).is.eql(1);
        const entry = entryCollector[0];

        expect(entry.severity).is.eql('info');
        expect(entry.level).is.eql(200);
        expect(entry.message).is.eql('nDu4wXyXZq');
        expect(entry.error).is.undefined;
        expect(entry.data?.nestedKey).is.eql({'key_Tg3YEpbkkD': 'Tg3YEpbkkD'});
    });

    it('Test Label', () => {
        dest.addDestination(new TestDestination());
        logger.info(
            'PAsDPNMaO3',
            new Label('type1', 7095),
            new Label('type1', 'jjdBmyie9f', '61QRWknheN'),
            new Label('type2', 'dVRZjUn5Il'),
            new Label('type3')
        );

        expect(entryCollector.length).is.eql(1);
        const entry = entryCollector[0];

        expect(entry.severity).is.eql('info');
        expect(entry.level).is.eql(200);
        expect(entry.message).is.eql('PAsDPNMaO3');
        expect(entry.error).is.undefined;

        // The mixing type in a label is a possible but not desirable
        expect(entry.data?.type1).is.eql([7095, 'jjdBmyie9f', '61QRWknheN']);
        expect(entry.data?.type2).is.eql(['dVRZjUn5Il']);
        expect(entry.data?.type3).is.undefined;
    });

    it('Test KVs and Tags', () => {
        dest.addDestination(new TestDestination());
        logger.info(
            'Rl2hju3NXI',
            new Label('type1', 'HDr4z3mHPj'),
            new Label('type1', 'MzeZyg2fr7'),
            new KV('key1', 'ha0v4A5ZRy'),
            new KV('key2', new Label('type2', 'asvKktnPcA')),
            new KV('key1', 'ignored')
        );

        expect(entryCollector.length).is.eql(1);
        const entry = entryCollector[0];

        expect(entry.severity).is.eql('info');
        expect(entry.level).is.eql(200);
        expect(entry.message).is.eql('Rl2hju3NXI');
        expect(entry.error).is.undefined;
        expect(entry.data?.type1).is.eql(['HDr4z3mHPj', 'MzeZyg2fr7']);
        expect(entry.data?.key1).is.eql('ha0v4A5ZRy');
        expect(entry.data?.key2).is.eql({type2: ['asvKktnPcA']});
    });

    it('Test Key Override', () => {
        dest.addDestination(new TestDestination());
        const kv = new KV('key1', '640W1CcPTF'); 
        logger.info('Test Override', kv, {key1: 'y3uEs8NBxq'});

        expect(entryCollector.length).is.eql(1);
        const entry = entryCollector[0];

        expect(entry.severity).is.eql('info');
        expect(entry.level).is.eql(200);
        expect(entry.message).is.eql('Test Override');
        expect(entry.error).is.undefined;
        expect(entry.data?.key1).is.eql('640W1CcPTF');
    });
});

import {
    expect,
    logCollector, entryCollector,
    clearLogCollector, clearEntryCollector,
    CustomError,
    TestDestination, TestAsyncDestination, TestLogStream
} from './testlib';

import {
    IJLogEntry, LoggerFactory,
    KV, Tags, mergeLoggableModels, buildOutputDataForDestination, AbstractLoggable, LogLevel, IJson
} from '@fp8proj';
import {LogWriter} from '@fp8proj/writer';



/**
 * Ensure that entry collector has collected one entry
 * and return that entry after deleting the `time` property
 * 
 * @returns 
 */
function getFirstEntryFromEntryCollector(): Partial<IJLogEntry> {
    expect(entryCollector.length).is.eql(1);
    const entry: Partial<IJLogEntry> = entryCollector[0];
    delete entry.time;
    return entry;
}

function getLoggablesFromLogEntry(entry: Partial<IJLogEntry>): AbstractLoggable[] {
    expect(entry.loggables).is.not.undefined;
    expect(entry.loggables?.length).is.greaterThan(0);
    return entry.loggables!;
}

describe('logger', () => {
    const dest = LogWriter.getInstance();
    const logger = LoggerFactory.create('test-logger');

    beforeEach(() => {
        dest.clearDestinations();
        clearLogCollector();
        clearEntryCollector();
    });

    it('Check config from factory', () => {
        // This must be added here or it will use config loaded from other Writer
        // not sure why the line below doesn't work if placed right after declaration of dest
        dest._reloadConfig();
        const config = LoggerFactory.loadedConfig;
        // from etc/local/logger.json
        const expected = {
            "severity": "info",
            "logger": {
                "my-logger": "debug"
            },
            "destination": {
                "TextDestination": {
                    "severity": "warn",
                    "filters": ["test-zEd7efJ0Pr"]
                },
                "JsonDestination": {
                    "severity": "error",
                    "filters": "test-D4qtS09paQ"
                }
            }
        };

        // console.log(config);
        expect(config).to.eql(expected);
    });

    it('no log', () => {
        logger.info('q9MyfvCGwd');
        expect(logCollector).to.eql([]);
    });

    it('no log - cb', () => {
        logger.info(() => 'q9MyfvCGwd');
        expect(logCollector).to.eql([]);
    });

    it('logger off', () => {
        dest.addDestination(new TestDestination(LogLevel.OFF));
        logger.debug('L4kFNn8yLq');
        expect(logCollector).to.eql([]);
    });

    it('debug log', () => {
        dest.addDestination(new TestDestination(LogLevel.DEBUG));
        logger.debug('FAySD0HVfS');
        expect(logCollector).to.eql(['SYNC-debug: FAySD0HVfS']);
    });

    it('debug log - cb', () => {
        dest.addDestination(new TestDestination(LogLevel.DEBUG));
        logger.debug(() => 'FAySD0HVfS');
        expect(logCollector).to.eql(['SYNC-debug: FAySD0HVfS']);
    });

    it('info async log', async () => {
        dest.addDestination(new TestAsyncDestination());
        logger.info('lH37czD9jC')
        await logger.logWritten();
        expect(logCollector).to.eql(['ASYNC-info: lH37czD9jC']);
    });

    it('info async log - cb', async () => {
        dest.addDestination(new TestAsyncDestination());
        logger.info(() => 'lH37czD9jC')
        await logger.logWritten();
        expect(logCollector).to.eql(['ASYNC-info: lH37czD9jC']);
    });

    it('info async log - cb with error', async () => {
        dest.addDestination(new TestAsyncDestination());
        logger.info(() => {throw new Error('Error type lH37czD9jC');})
        await logger.logWritten();
        expect(logCollector).to.eql(['ASYNC-info: log message callback threw error Error type lH37czD9jC']);
    });

    it('warn stream log', async () => {
        dest.addDestination(new TestLogStream());
        logger.warn('kuh3lp3WVj')
        await logger.logWritten();
        expect(logCollector).to.eql(['STREAM-warn: kuh3lp3WVj']);
    });

    it('warn stream log - cb', async () => {
        dest.addDestination(new TestLogStream());
        logger.warn(() => 'kuh3lp3WVj')
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
        clearLogCollector();

        LoggerFactory.removeLogDestination('stream');
        logger.panic('6gaabROqBx');
        await logger.logWritten();
        expect(logCollector).to.eql([
            'SYNC-panic: 6gaabROqBx', 'ASYNC-panic: 6gaabROqBx'
        ]);

        // Note: clear destination is already as it's used in beforeEach 
    });

    it('3 destinations with LoggerFactory - cb', async () => {
        // Step 1: add 3 destinations
        LoggerFactory.addLogDestination(new TestDestination(), 'sync');
        LoggerFactory.addLogDestination(new TestAsyncDestination(), 'async');
        LoggerFactory.addLogDestination(new TestLogStream(), 'stream');
        logger.error(() => 'uxqEbnCXeZ');

        await logger.logWritten();
        expect(logCollector).to.eql([
            'SYNC-error: uxqEbnCXeZ', 'STREAM-error: uxqEbnCXeZ', 'ASYNC-error: uxqEbnCXeZ'
        ]);

        // Step 2: remove one destination
        clearLogCollector();

        LoggerFactory.removeLogDestination('stream');
        logger.panic(() => '6gaabROqBx');
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

        const entry = getFirstEntryFromEntryCollector();

        expect(entry.severity).is.eql('error');
        expect(entry.level).is.eql(500);
        expect(entry.message).is.eql('CFYlQXcdGf');
        expect(entry.error).is.equal(error);
    });

    it('Test Error - cb', () => {
        dest.addDestination(new TestDestination());
        const error = new Error('CFYlQXcdGf'); 
        logger.error(() => error);

        const entry = getFirstEntryFromEntryCollector();

        expect(entry.severity).is.eql('error');
        expect(entry.level).is.eql(500);
        expect(entry.message).is.eql('CFYlQXcdGf');
        expect(entry.error).is.equal(error);
    });

    it('Test Error with Message', () => {
        dest.addDestination(new TestDestination());
        const error = new Error('ldyoMdOhv9'); 
        logger.error('Error message for ldyoMdOhv9', error);

        const entry = getFirstEntryFromEntryCollector();

        expect(entry.severity).is.eql('error');
        expect(entry.level).is.eql(500);
        expect(entry.message).is.eql('Error message for ldyoMdOhv9');
        expect(entry.error).is.equal(error);

        const logData = buildOutputDataForDestination(entry.loggables, entry.data, entry.values);
        expect(logData).is.eql({});
    });

    it('Test Error with Message - cb', () => {
        dest.addDestination(new TestDestination());
        const error = new Error('ldyoMdOhv9'); 
        logger.error(() => 'Error message for ldyoMdOhv9', error);

        const entry = getFirstEntryFromEntryCollector();

        expect(entry.severity).is.eql('error');
        expect(entry.level).is.eql(500);
        expect(entry.message).is.eql('Error message for ldyoMdOhv9');
        expect(entry.error).is.equal(error);

        const logData = buildOutputDataForDestination(entry.loggables, entry.data, undefined, entry.values);
        expect(logData).is.eql({});
    });

    it('Test Error with multiple entries', () => {
        dest.addDestination(new TestDestination());
        const error = new Error('ee8EImX6BH');
        const custom = new CustomError('p4e52JDLvY')
        logger.error(() => 'Error message for ee8EImX6BH', error, custom);

        const entry = getFirstEntryFromEntryCollector();
        
        expect(entry.severity).is.eql('error');
        expect(entry.level).is.eql(500);
        expect(entry.message).is.eql('Error message for ee8EImX6BH');
        expect(entry.error).is.equal(error);
        expect(entry.loggables).to.have.length(1);

        const loggableError = entry.loggables![0].toIJson();

        expect(loggableError.CustomError).not.to.be.undefined;
        const customError = loggableError.CustomError! as IJson;

        expect(customError.name).is.eql('Error');
        expect(customError.message).is.eql('p4e52JDLvY');
        expect(customError.stack).to.satisfies((s: string) => s.startsWith('Error: p4e52JDLvY'));
    });

    it('Test invalid string as Error', () => {
        dest.addDestination(new TestDestination());
        const err = 'This is not an error' as unknown as Error;
        logger.error(err);

        const entry = getFirstEntryFromEntryCollector();
        expect(entry.message).is.eql('This is not an error');
        expect(entry.error).is.undefined;

        const logData = buildOutputDataForDestination(entry.loggables, entry.data, undefined, entry.values);
        expect(logData).is.eql({});

        // Test the second log
        logger.error('Message is given', err);

        expect(entryCollector.length).is.eql(2);
        expect(entryCollector[1].message).is.eql('Message is given');
        expect(entryCollector[1].values).is.eql(['This is not an error']);
        expect(entryCollector[1].error).is.undefined;
        expect(entryCollector[1].data).is.undefined;
    });

    it('Test invalid number as Error', () => {
        dest.addDestination(new TestDestination());
        const err = 4540 as unknown as Error;
        logger.error('Error message', err);

        const entry = getFirstEntryFromEntryCollector();

        // The `4540` is captured in the .values 
        expect(entry).to.eql(
            {
                name: 'test-logger',
                severity: 'error',
                level: 500,
                message: 'Error message',
                error: undefined,
                values: [4540]
            }
        );

        const logData = buildOutputDataForDestination(entry.loggables, entry.data, undefined, entry.values);
        expect(logData).is.eql({"values": [4540]});
    });

    it('Test IJson', () => {
        dest.addDestination(new TestDestination());
        logger.info('IJson log', {key_ycUrTEToWP: 'ycUrTEToWP'});

        const entry = getFirstEntryFromEntryCollector();
        expect(entry.severity).is.eql('info');
        expect(entry.level).is.eql(200);
        expect(entry.message).is.eql('IJson log');
        expect(entry.error).is.undefined;
        expect(entry.data).is.eql({key_ycUrTEToWP: 'ycUrTEToWP'});

        const logData = buildOutputDataForDestination(entry.loggables, entry.data, {}, entry.values);
        expect(logData).is.eql({key_ycUrTEToWP: 'ycUrTEToWP'});
    });

    it('Test KV', () => {
        dest.addDestination(new TestDestination());
        const kv = new KV('key_k6HraLIn8I', 'k6HraLIn8I'); 
        logger.info('v8aNlgLIfi', kv);

        const entry = getFirstEntryFromEntryCollector();
        expect(entry.severity).is.eql('info');
        expect(entry.level).is.eql(200);
        expect(entry.message).is.eql('v8aNlgLIfi');
        expect(entry.error).is.undefined;
        expect(entry.data).is.undefined;

        const loggables = getLoggablesFromLogEntry(entry);
        expect(loggables[0].toIJson()).is.eql({"key_k6HraLIn8I": "k6HraLIn8I"});

        const logData = buildOutputDataForDestination(entry.loggables, entry.data, {}, entry.values);
        expect(logData).is.eql({"key_k6HraLIn8I": "k6HraLIn8I"});
    });

    it('Test KV nested', () => {
        dest.addDestination(new TestDestination());
        const kv = new KV('key_Tg3YEpbkkD', 'Tg3YEpbkkD'); 
        logger.info('nDu4wXyXZq', KV.of('nestedKey', kv));

        const entry = getFirstEntryFromEntryCollector();

        expect(entry.severity).is.eql('info');
        expect(entry.level).is.eql(200);
        expect(entry.message).is.eql('nDu4wXyXZq');
        expect(entry.error).is.undefined;
        expect(entry.data).is.undefined;

        const loggables = getLoggablesFromLogEntry(entry);
        expect(loggables[0].toIJson()).is.eql({
            nestedKey: {key_Tg3YEpbkkD: 'Tg3YEpbkkD'}
        });

        const logData = buildOutputDataForDestination(entry.loggables, entry.data, {}, entry.values);
        expect(logData).is.eql({
            nestedKey: {key_Tg3YEpbkkD: 'Tg3YEpbkkD'}
        });
    });

    it('Test Tag', () => {
        dest.addDestination(new TestDestination());
        logger.info(
            'PAsDPNMaO3',
            new Tags('type1', 7095),
            new Tags('type1', 'jjdBmyie9f', '61QRWknheN'),
            new Tags('type2', 'dVRZjUn5Il'),
            new Tags('type3')
        );

        const entry = getFirstEntryFromEntryCollector();
        expect(entry.severity).is.eql('info');
        expect(entry.level).is.eql(200);
        expect(entry.message).is.eql('PAsDPNMaO3');
        expect(entry.error).is.undefined;
        expect(entry.data).is.undefined;

        const loggables = getLoggablesFromLogEntry(entry);

        // The mixing type in a tag is a possible but not desirable
        expect(loggables).is.eql([
            new Tags('type3'),
            new Tags('type2', 'dVRZjUn5Il'),
            new Tags('type1', 'jjdBmyie9f', '61QRWknheN'),
            new Tags('type1', 7095)
        ]);

        const {loggableJson, loggableValues} = mergeLoggableModels(...loggables);
        expect(loggableJson).is.eql({
            type3: [],
            type2: [ 'dVRZjUn5Il' ],
            type1: [ 7095 ]
        });
        expect(loggableValues).is.eql([]);

        const logData = buildOutputDataForDestination(entry.loggables, entry.data, {}, entry.values);
        expect(logData).is.eql({
            type3: [],
            type2: [ 'dVRZjUn5Il' ],
            type1: [ 7095 ]
        });
    });

    it('Test KVs and Tags', () => {
        dest.addDestination(new TestDestination());
        logger.info(
            'Rl2hju3NXI',
            new Tags('type1', 'HDr4z3mHPj'),
            new Tags('type1', 'MzeZyg2fr7'),
            new KV('key1', 'ha0v4A5ZRy'),
            new KV('key2', new Tags('type2', 'asvKktnPcA')),
            new KV('key1', 'ignored')
        );

        const entry = getFirstEntryFromEntryCollector();

        expect(entry.severity).is.eql('info');
        expect(entry.level).is.eql(200);
        expect(entry.message).is.eql('Rl2hju3NXI');
        expect(entry.error).is.undefined;
        expect(entry.data).is.undefined;

        const loggables = getLoggablesFromLogEntry(entry);

        expect(loggables).is.eql([
            new KV('key1', 'ignored'),
            new KV('key2', new Tags('type2', 'asvKktnPcA')),
            new KV('key1', 'ha0v4A5ZRy'),
            new Tags('type1', 'MzeZyg2fr7'),
            new Tags('type1', 'HDr4z3mHPj')
        ]);

        const {loggableJson, loggableValues} = mergeLoggableModels(...loggables);
        expect(loggableJson).is.eql({
            key1: 'ha0v4A5ZRy',
            key2: { type2: ['asvKktnPcA'] },
            type1: [ 'HDr4z3mHPj' ]
        });
        expect(loggableValues).is.eql([]);

        const logData = buildOutputDataForDestination(entry.loggables, entry.data, {}, entry.values);
        expect(logData).is.eql({
            key1: 'ha0v4A5ZRy',
            key2: { type2: ['asvKktnPcA'] },
            type1: [ 'HDr4z3mHPj' ]
        });
    });

    it('Test Key Override', () => {
        dest.addDestination(new TestDestination());
        const kv = new KV('key1', '640W1CcPTF'); 
        logger.info('Test Override', {key1: 'y3uEs8NBxq'}, {key2: 'LxZFU8NMUq'}, kv);

        const entry = getFirstEntryFromEntryCollector();
        
        expect(entry.severity).is.eql('info');
        expect(entry.level).is.eql(200);
        expect(entry.message).is.eql('Test Override');
        expect(entry.error).is.undefined;
        expect(entry.data).is.eql({
            key1: 'y3uEs8NBxq',
            key2: 'LxZFU8NMUq'
        });

        const loggables = getLoggablesFromLogEntry(entry);
        expect(loggables).is.eql([kv]);

        // Ensure that key1 is overwritten by KV and that key2 is present in the final output
        // NB: The key1 is overwritten by KV not because of the sequence but because KV is processed
        // after data in buildOutputDataForDestination
        const logData = buildOutputDataForDestination(loggables, entry.data, {}, entry.values);
        expect(logData).is.eql({
            key1: '640W1CcPTF',
            key2: 'LxZFU8NMUq'
        });
    });
});

import {expect} from './testlib';

import {
    LogLevel, IJLogEntry,
    convertSeverityToLevel
} from '@fp8proj/core';

import {LoggerConfig, readLoggerConfig, IisWriteNeededParams} from '@fp8proj/config';

describe('config', () => {
    describe('readLoggerConfig', testReadLoggerConfig);
    describe('isWriteNeeded', testIsWriteNeeded);
});

/**
 * Test readLoggerConfig
 */
function testReadLoggerConfig() {
    const emptyConfig = {
        configDir: undefined,
        level: LogLevel.INFO,
        loggerOverride: {},
        destinationOverride: {}
    };

    it('convertSeverityToLevel', () => {
        expect(convertSeverityToLevel('info')).to.eql(LogLevel.INFO);
        expect(convertSeverityToLevel('off')).to.eql(LogLevel.OFF);
        expect(convertSeverityToLevel('invalid')).to.be.undefined;
    });

    it('readLoggerConfig - default', () => {
        const config = readLoggerConfig();
        const expected = {
            configDir: './etc/local',
            level: LogLevel.INFO,
            loggerOverride: {
                'my-logger': LogLevel.DEBUG
            },
            destinationOverride: {
                TextDestination: {
                    level: LogLevel.WARNING,
                    filters: ['test-zEd7efJ0Pr']
                },
                JsonDestination: {
                    level: LogLevel.ERROR,
                    filters: ['test-D4qtS09paQ']
                }
            }
        };

        // console.log('### ', config);
        expect(config).to.eql(expected);
        
    });

    it('readLoggerConfig - simple', () => {
        const config = readLoggerConfig('simple');
        const expected = {
            configDir: './etc/simple',
            level: LogLevel.ERROR,
            loggerOverride: {},
            destinationOverride: {}
        };

        // console.log('### ', config);
        expect(config).to.eql(expected);
    });

    /**
     * If invalid severity is set at root level, it will get converted into INFO
     * If override entry provides a bad level, override entry will not be created
     */
    it('readLoggerConfig - invalid', () => {
        const config = readLoggerConfig('invalid');
        const expected = {
            configDir: './etc/invalid',
            level: LogLevel.INFO,
            loggerOverride: {
                'another-logger': LogLevel.DEBUG
            },
            destinationOverride: {
                TestSimpleTextDestination: {
                    level: undefined,
                    filters: ['the-logger']
                }
            }
        };

        // console.log('### ', config);
        expect(config).to.eql(expected);
    });

    it('readLoggerConfig - bad', () => {
        const config = readLoggerConfig('bad');
        // console.log('### ', config);
        expect(config).to.eql(emptyConfig);
    });

}

/**
 * Test different override for the isWriteNeeded
 */
function testIsWriteNeeded() {
    it('no config, level set on logger', () => {
        const config = new LoggerConfig();
        const params: IisWriteNeededParams = {
            loggerLevel: LogLevel.ERROR,
            destinationName: 'test-dest'
        };
        const entry: IJLogEntry = {
            name: 'test-logger',
            level: LogLevel.INFO,
            severity: 'info',
            message: 'test message',
            time: new Date()
        };

        expect(config.isWriteNeeded(entry, params)).to.be.false;

        entry.level = LogLevel.DEBUG;
        expect(config.isWriteNeeded(entry, params)).to.be.false;

        entry.level = LogLevel.ERROR;
        expect(config.isWriteNeeded(entry, params)).to.be.true;
    });

    it('no config, level destination override', () => {
        const config = new LoggerConfig();
        const params: IisWriteNeededParams = {
            loggerLevel: LogLevel.INFO,
            destinationName: 'test-dest',
            destinationLevel: LogLevel.WARNING
        };
        const entry: IJLogEntry = {
            name: 'test-logger',
            level: LogLevel.INFO,
            severity: 'info',
            message: 'test message',
            time: new Date()
        };

        expect(config.isWriteNeeded(entry, params)).to.be.false;

        entry.level = LogLevel.DEBUG;
        expect(config.isWriteNeeded(entry, params)).to.be.false;

        entry.level = LogLevel.WARNING;
        expect(config.isWriteNeeded(entry, params)).to.be.true;
    });

    it('destination loggerName filter', () => {
        // Note that filters work based on matching logger name starting with
        const config = new LoggerConfig({
            destination: {
                'test-dest': {
                    severity: 'warn',
                    filters: ['test-logger']
                }
            }
        });
        const paramsA: IisWriteNeededParams = {
            loggerLevel: LogLevel.INFO,
            destinationName: 'test-dest',
            destinationLevel: LogLevel.INFO
        };
        const paramsB: IisWriteNeededParams = {
            loggerLevel: LogLevel.INFO,
            destinationName: 'another-dest-B',
            destinationLevel: LogLevel.INFO
        };
        const entry: IJLogEntry = {
            name: 'test-logger-A',
            level: LogLevel.INFO,
            severity: 'info',
            message: 'test message',
            time: new Date()
        };

        // Filter that output only warning 

        /*
        paramsA is false as it's set to warn via the config override
        paramsB is true as it's set to INFO via the logger level
        */
        expect(config.isWriteNeeded(entry, paramsA)).to.be.false;
        expect(config.isWriteNeeded(entry, paramsB)).to.be.true;

        /*
        paramsA is false as it's set to warn via the config override
        paramsB is false as it's set to INFO via the logger level
        */
        entry.level = LogLevel.DEBUG;
        expect(config.isWriteNeeded(entry, paramsA)).to.be.false;
        expect(config.isWriteNeeded(entry, paramsB)).to.be.false;

        /*
        paramsA is true as it's set to warn via the config override
        paramsB is true as it's set to INFO via the logger level
        */
        entry.level = LogLevel.WARNING;
        expect(config.isWriteNeeded(entry, paramsA)).to.be.true;
        expect(config.isWriteNeeded(entry, paramsB)).to.be.true;

        /*
        Similar to previous scenario but ensuring that logger name is the same as filter
        * paramsA is true as it's set to warn via the config override
        * paramsB is true as it's set to INFO via the logger level
        */
        entry.name = 'test-logger';
        expect(config.isWriteNeeded(entry, paramsA)).to.be.true;
        expect(config.isWriteNeeded(entry, paramsB)).to.be.true;

        /*
        Similar to previous scenario but logger name not longer match filter.  The log therefore is not written
        * paramsA is false as filter finds no logger match
        * paramsB is true as it's set to INFO via the logger level
        */
        entry.name = 'test-log';
        expect(config.isWriteNeeded(entry, paramsA)).to.be.false;
        expect(config.isWriteNeeded(entry, paramsB)).to.be.true;

        /*
        Ensure that log is not written for paramsA even if info
        * paramsA is false as filter finds no logger match
        * paramsB is true as it's set to INFO via the logger level
        */
        entry.level = LogLevel.INFO;
        entry.name = 'my-other';
        expect(config.isWriteNeeded(entry, paramsA)).to.be.false;
        expect(config.isWriteNeeded(entry, paramsB)).to.be.true;
    });
}

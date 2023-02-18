import {expect} from './testlib';

import {
    LogLevel, convertSeverityToLevel,
    readLoggerConfig
} from '@fp8proj/core';

describe('core', () => {
    const emptyConfig = {
        configDir: undefined,
        level: LogLevel.INFO,
        override: {} 
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
            override: {
                'my-logger': LogLevel.DEBUG
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
            override: {}
        };

        // console.log('### ', config);
        expect(config).to.eql(expected);
    });

    /**
     * If invalid severity is set at root level, it will get converted into INFO
     * If override entry provides a bad level, override entry will not be created
     */
    it('readLoggerConfig - invalid-level', () => {
        const config = readLoggerConfig('invalid-level');
        const expected = {
            configDir: './etc/invalid-level',
            level: LogLevel.INFO,
            override: {
                'another-logger': LogLevel.DEBUG
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

});
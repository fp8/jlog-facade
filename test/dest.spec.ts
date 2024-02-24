import {
    KV, LoggerFactory,
    LogLevel, Loggable
} from "@fp8proj";

import {CIRCULAR_STRUCTURE_ERROR} from "@fp8proj/helper";

import {
    expect,
    logCollector, clearLogCollector,
    TestSimpleTextDestination, TestSimpleJsonDestination
} from "./testlib";

// A object with parent
class TestNodeObject{
    constructor(
        public name: string,
        public parent?: TestNodeObject
    ) {}

    // Set parent node
    setParent(parent: TestNodeObject) {
        this.parent = parent;
    }
}

// Create an instance of TestNodeObject with circular reference
const circularNode = new TestNodeObject('child');
circularNode.setParent(circularNode);


describe('dest', () => {
    const logger = LoggerFactory.create('test-dest-logger');

    beforeEach(() => {
        LoggerFactory.clearLogDestination();
        clearLogCollector();
    });

    describe('text', () => {
        it('simple info', () => {
            LoggerFactory.addLogDestination(new TestSimpleTextDestination());
            logger.info('This is message for 9xeyQ0ikKe');
            expect(logCollector).is.eql(['|I This is message for 9xeyQ0ikKe']);
        });
    
        it('simple error', () => {
            LoggerFactory.addLogDestination(new TestSimpleTextDestination());
            const error = new Error('lwi3U0CyET is bad');
            logger.error(error);
            expect(logCollector).is.eql(['|E lwi3U0CyET is bad']);
        });
    
        it('simple error with message', () => {
            LoggerFactory.addLogDestination(new TestSimpleTextDestination());
            const error = new Error('WryAUrSVas failed');
            logger.error('WryAUrSVas process did not work', error);
            expect(logCollector).is.eql(['|E WryAUrSVas process did not work [Error:WryAUrSVas failed]']);
        });
    
        it('warn with payload', () => {
            LoggerFactory.addLogDestination(new TestSimpleTextDestination());
            logger.warn('This is warning of k2haHZGtKy', new KV('entry', 'NmAlwOI6D7'));
            expect(logCollector).is.eql([ '|W This is warning of k2haHZGtKy {"entry":"NmAlwOI6D7"}' ]);
        });
    });

    describe('json', () => {
        it('simple debug - no setting', () => {
            LoggerFactory.addLogDestination(new TestSimpleJsonDestination());
            logger.debug('Debug message for 40duGee19n');
            expect(logCollector).is.eql([]);
        });
    
        it('simple debug', () => {
            LoggerFactory.addLogDestination(new TestSimpleJsonDestination(LogLevel.DEBUG));
            logger.debug('Debug message for VnFdNvbyTq');
            expect(logCollector).is.eql(['{"m":"D|Debug message for VnFdNvbyTq"}']);
        });
    
        it('info with payload', () => {
            LoggerFactory.addLogDestination(new TestSimpleJsonDestination());
            logger.info('Info message for UurqWHYMyJ', new KV('processId', 'UurqWHYMyJ'));
            expect(logCollector).is.eql(['{"m":"I|Info message for UurqWHYMyJ","processId":"UurqWHYMyJ"}']);
        });
    
        it('error', () => {
            LoggerFactory.addLogDestination(new TestSimpleJsonDestination(LogLevel.INFO, false));
            const error = new Error('vOGQbtxvfD');
            logger.error(error);
            expect(logCollector).is.eql(['{"m":"E|vOGQbtxvfD","e":"Error: vOGQbtxvfD"}']);
        });
    
        it('error with stack', () => {
            LoggerFactory.addLogDestination(new TestSimpleJsonDestination());
            const error = new Error('qbsKviHUSV');
            logger.warn('qbsKviHUSV did not work', error);
    
            expect(logCollector.length).is.eql(1);
    
            const json = JSON.parse(logCollector[0]);
            expect(json.m).is.eql('W|qbsKviHUSV did not work');
            expect(json.e).is.eql('Error: qbsKviHUSV');
            expect(json.s).satisfies((message: string) => message.startsWith('Error: qbsKviHUSV'));
        });
    
        it('LogLevel INFO', () => {
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
    
        it('LogLevel PANIC', () => {
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

        it('logger level override', () => {
            LoggerFactory.addLogDestination(new TestSimpleJsonDestination());
            const logger = LoggerFactory.getLogger('logger-mrtd38MwG8', LogLevel.WARNING);
    
            logger.info('info log for logger-mrtd38MwG8');
            logger.warn('warn log for logger-mrtd38MwG8');
            logger.error('error log for logger-mrtd38MwG8');
            
            expect(logCollector).is.eql([
                '{"m":"W|warn log for logger-mrtd38MwG8"}',
                '{"m":"E|error log for logger-mrtd38MwG8"}'
            ]);
        });
    
        it('logger level override - ', () => {
            // Destination overrides level of logger
            LoggerFactory.addLogDestination(new TestSimpleJsonDestination(LogLevel.INFO));
            const logger = LoggerFactory.getLogger('logger-ThBC4wm1OJ', LogLevel.ERROR);
    
            logger.info('info log for logger-ThBC4wm1OJ');
            logger.warn('warn log for logger-ThBC4wm1OJ');
            logger.error('error log for logger-ThBC4wm1OJ');
            
            expect(logCollector).is.eql([
                '{"m":"I|info log for logger-ThBC4wm1OJ"}',
                '{"m":"W|warn log for logger-ThBC4wm1OJ"}',
                '{"m":"E|error log for logger-ThBC4wm1OJ"}'
            ]);
        });
    });

    describe('json error', () => {
        it('circular reference', () => {
            LoggerFactory.addLogDestination(new TestSimpleJsonDestination());
            logger.error('circular reference', Loggable.of('circular', circularNode ));

            expect(logCollector.length).is.eql(1);
            const json = JSON.parse(logCollector[0]);
            expect(json.m).to.eql('E|circular reference');
            expect(json.circular).to.eql({name: 'child', parent: CIRCULAR_STRUCTURE_ERROR});
        });
    });
});

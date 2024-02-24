import { Writable } from 'stream';

import {
    IJLogEntry, ISimpleJsonOutput, LogLevel,
    AbstractLogDestination, AbstractAsyncLogDestination,
    SimpleTextDestination, SimpleJsonDestination, IJson,
    safeStringify
} from "@fp8proj";

import {useDestination} from "@fp8proj/dest";

export let logCollector: string[] = [];
export let entryCollector: IJLogEntry[] = [];

export function clearLogCollector(): void {
    logCollector = []
}

export function clearEntryCollector(): void {
    entryCollector = []
}

/**
 * Capture only log entry ignoring the log level and default payload
 *
 * @param entry 
 * @param loggerLevel 
 * @param defaultPayload 
 */
export function logEntryInterceptor(entry: IJLogEntry, loggerLevel?: LogLevel, defaultPayload?: IJson) : void {
    logCollector.push(entry.message);
    entryCollector.push(entry);
}

export function addToLogAndEntryCollector(source: string, entry: IJLogEntry) {
    let message = `${source}-${entry.severity}`;

    if (entry.message !== undefined) {
        message = `${message}: ${entry.message}`
    }

    logCollector.push(message);
    entryCollector.push(entry);
}

export class TestDestination extends AbstractLogDestination {
    static use(level?: string | LogLevel, ...filters: string[]): TestDestination {
        return useDestination(TestDestination, level, filters);
    }

    override write(entry: IJLogEntry): void {
        addToLogAndEntryCollector('SYNC', entry);
        console.log('TestDestination: ', safeStringify(entry));
    }
}

export class TestAsyncDestination extends AbstractAsyncLogDestination {
    static use(level?: string | LogLevel, ...filters: string[]): TestAsyncDestination {
        return useDestination(TestAsyncDestination, level, filters);
    }

    override async write(entry: IJLogEntry): Promise<void> {
        return new Promise((resolve, _) => {
            setTimeout(() => {
                addToLogAndEntryCollector('ASYNC', entry);
                console.log('TestAsyncDestination: ', safeStringify(entry));
                resolve();
            }, 200);
        });
    }
}

export class TestLogStream extends Writable {
    constructor() {
        super({objectMode: true});
    }
    override _write(chunk: IJLogEntry, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        addToLogAndEntryCollector('STREAM', chunk);
        console.log('TestLogStream: ', safeStringify(chunk));
    }
}

export class TestSimpleTextDestination extends SimpleTextDestination {
    static use(level?: string | LogLevel, ...filters: string[]): TestSimpleTextDestination {
        return useDestination(TestSimpleTextDestination, level, filters);
    }
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

export class TestSimpleJsonDestination extends SimpleJsonDestination {
    static use(level?: string | LogLevel, ...filters: string[]): TestSimpleJsonDestination {
        return useDestination(TestSimpleJsonDestination, level, filters);
    }
    override write(entry: IJLogEntry, loggerLevel?: LogLevel, defaultPayload?: IJson): void {
        const result = this.formatOutput(entry, loggerLevel, defaultPayload);
        console.log(safeStringify(result));

        // Delete the timestamp from collected log as it can't be tested
        const collect: Omit<ISimpleJsonOutput, 't'> = result;
        delete collect.t;
        logCollector.push(safeStringify(collect));
    }
}

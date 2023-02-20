import { TLogDestination, LogWriter } from './writer';
import { JLogger } from './logger';
import { LogLevel } from './core';

/**
 * ## Json Logger Façada
 * 
 * Create an instance of {@link JLogger}
 * 
 * Usage:
 * 
 * ```ts
 * const logger = LoggerFactory.create('my-logger');
 * logger.info('The processing has started', new KV('processId', 123456));
 * ```
 * 
 * Severity Supported (see {@link LogSeverity}):
 * 
 * - debug
 * - info
 * - warn
 * - error
 * - panic
 * 
 */
export class LoggerFactory {
    private static readonly writer = LogWriter.getInstance();
    private constructor() {}

    /**
     * Create an instance of logger
     *
     * @param name 
     * @returns 
     */
    public static create(name: string, level?: LogLevel): JLogger {
        return new JLogger(name, level);
    }

    /**
     * Create a synonymous for .create
     *
     * @param name 
     * @returns 
     */
    public static getLogger(name: string, level?: LogLevel): JLogger {
        return LoggerFactory.create(name, level);
    }

    /**
     * Add a destination to output the log
     *
     * @param destination 
     * @param name 
     */
    public static addLogDestination(destination: TLogDestination, name?: string): void {
        this.writer.addDestination(destination, name); 
    }

    /**
     * Remove a specific log destination
     *
     * @param name 
     */
    public static removeLogDestination(name?: string): void {
        this.writer.removeDestination(name);
    }

    /**
     * Clear all log destinations
     */
    public static clearLogDestination(): void {
        this.writer.clearDestinations();
    }
}

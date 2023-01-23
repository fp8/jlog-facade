import { JLogger } from './logger';
import { TLogDestination, LogWriter } from './writer';

/**
 * ## Json Logger Façada
 * 
 * Create an instance of {@link JLogger}
 * 
 * #### Usage:
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
    public static create(name: string): JLogger {
        return new JLogger(name);
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

export {
    TJsonValue, TLoggableValue, IJson, IJLogEntry,
    LogSeverity, LogLevel,
    AbstractLoggable,
    AbstractLogDestination, AbstractAsyncLogDestination
} from './core';

export * from './models';
export * from './dest';

// Allow user to create a customized instance of JLogger
export {
    JLogger
};
export { TLoggableParam, TLoggableEntry } from './logger';
export { TLogDestination } from './writer';

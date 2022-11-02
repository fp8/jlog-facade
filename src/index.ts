import { JLogger } from './logger';
import { TLogDestination, LogWriter } from './writer';

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
     * Remove a specif log destination
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
    TJsonValue, IJson, IJLogEntry,
    LogSeverity, LogLevel,
    AbstractLogDestination, AbstractAsyncLogDestination
} from './core';

export * from './models';

// Allow user to create a customized instance of JLogger
export {
    JLogger
};
export { TLoggableParams, TLoggableEntries } from './logger';

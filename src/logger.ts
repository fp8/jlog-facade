import {
    LogSeverity, LogLevel,
    IJLogEntry, IJson,
    AbstractLoggable
} from './core';

import {LogWriter} from './writer';
import {LoggableError} from './models';


type TLoggableParams = AbstractLoggable | IJson;

/**
 * Additional object type that can be passed to be written to log.  Can be one of:
 * 
 * - Error object
 * - Instance of AbstractLoggable
 * - IJson
 */
export type TLoggableEntries = Error | TLoggableParams;

/**
 * Json Logger objact.  Do not use this class directly; always create an instance of JLogger using {@link LoggerFactory}
 */
export class JLogger {
    constructor(private name: string) {}

    /**
     * Function to convert severity string to a level number
     * @param severity 
     * @returns 
     */
    private logSeverityToLevel(severity: string | LogSeverity): LogLevel {
        switch (severity) {
            case LogSeverity.DEBUG:
                return LogLevel.DEBUG;
            case LogSeverity.INFO:
                return LogLevel.INFO;
            case LogSeverity.WARNING:
                return LogLevel.WARNING;
            case LogSeverity.ERROR:
                return LogLevel.ERROR;
            case LogSeverity.PANIC:
                return LogLevel.PANIC;
            default:
                return LogLevel.INFO;
        }
    }


    /**
     * Isolate the first error from the params and return a clean LoggableParams
     * 
     * @param input 
     * @returns 
     */
    private extractError(message: string | Error, input: TLoggableEntries[]): [Error | undefined, TLoggableParams[]] {
        let errorIsSet = false;
        const result: TLoggableParams[] = [];

        let error: Error | undefined = undefined;
        
        // If message is of type Error, use that as error returned
        if (message instanceof Error) {
            error = message;
            errorIsSet = true;
        }

        // Parse input
        for (const entry of input) {
            if (entry instanceof Error) {
                if (errorIsSet) {
                    // tranform error into IJSON
                    result.push(new LoggableError(entry));
                } else {
                    error = entry;
                    errorIsSet = true;
                }
            } else {
                result.push(entry);
            }
        }

        return [error, result];
    }

    /**
     * Collapse all LoggableParams into a single IJson
     *
     * @param input 
     * @returns 
     */
    private mergeParams(input: TLoggableParams[]): IJson {
        const entries = input.map(entry => {
            if (entry instanceof AbstractLoggable) {
                return entry.toIJson();
            } else {
                return entry;
            }
        });

        return Object.assign({}, ...entries);
    }

    /**
     * The main logging method that actually write to the log.  The objective is to allow caller
     * to pass only Error object as a log, as well as supporting the case where a log contains
     * both the message and Error object.  The `message` attribute must never be undefined.
     *
     * @param level 
     * @param message string or instance of Error
     * @param rest 
     */
    protected log(severity: string | LogSeverity, message: string | Error, ...rest: TLoggableEntries[]): void {
        const writer = LogWriter.getInstance();

        // skip any logging if no destination has been set
        if (!writer.hasDestination) {
            return;
        }

        const level = this.logSeverityToLevel(severity);

        // Extract data to log from params
        const [error, params] = this.extractError(message, rest);
        const data = this.mergeParams(params);

        // Set the message and error to be set in the log entry
        let messageToUse: string;
        if (message instanceof Error) {
            messageToUse = message.message;
        } else {
            messageToUse = message;
        }

        const entry: IJLogEntry = {
            name: this.name,
            severity,
            level,
            message: messageToUse,
            error,
            data,
            time: new Date()
        };

        writer.write(entry);
    }

    /** Write a {@link LogSeverity.DEBUG} severity log */
    public debug(message: string | Error, ...rest: TLoggableEntries[]): void {
        this.log(LogSeverity.DEBUG, message, ...rest);
    }

    /** Write a {@link LogSeverity.INFO} severity log */
    public info(message: string | Error, ...rest: TLoggableEntries[]): void {
        this.log(LogSeverity.INFO, message, ...rest);
    }

    /** Write a {@link LogSeverity.WARNING} severity log */
    public warn(message: string | Error, ...rest: TLoggableEntries[]): void {
        this.log(LogSeverity.WARNING, message, ...rest);
    }

    /** Write a {@link LogSeverity.ERROR} severity log */
    public error(message: string | Error, ...rest: TLoggableEntries[]): void {
        this.log(LogSeverity.ERROR, message, ...rest);
    }

    /** Write a {@link LogSeverity.PANIC} severity log */
    public panic(message: string | Error, ...rest: TLoggableEntries[]): void {
        this.log(LogSeverity.PANIC, message, ...rest);
    }

    /**
     * If a async destination based on {@link AbstractAsyncLogDestination} exists, use
     * this method to wait for last log call complete.
     *
     * @param maxRetry number of time to retry.  Default to retry for 20 times.
     * @returns 
     */
    public async hasLogCompleted(maxRetry=20): Promise<void> {
        const writer = LogWriter.getInstance();
        return writer.waitProcessComplete(maxRetry);
    }
}

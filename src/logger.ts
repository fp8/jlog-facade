import {
    TJsonValue, IJson, DEFAULT_LOG_LEVEL,
    LogSeverity, LogLevel, convertSeverityToLevel,
    IJLogEntry, AbstractLoggable,
    mergeIJsonShallow
} from './core';

import {isEmpty, isObject} from './helper';
import {LogWriter} from './writer';
import {LoggableError} from './models';


/**
 * Actual type that can be used as a logger message
 */
type TLoggerMessageTypeBase = string | Error;

/**
 * Types that can be passed to logger as a message
 */
export type TLoggerMessageType = TLoggerMessageTypeBase | (() => TLoggerMessageTypeBase);

/**
 * Object type supported by Logger
 */
export type TLoggableParam = AbstractLoggable | IJson;

/**
 * Additional object type that can be passed to be written to log.  Can be one of:
 * 
 * - Error object
 * - Instance of AbstractLoggable
 * - IJson
 */
export type TLoggableEntry = Error | TLoggableParam;

/**
 * Json Logger objact.  Do not use this class directly; always create an instance of JLogger using {@link LoggerFactory}
 */
export class JLogger {
    constructor(private name: string, public readonly logLevel?: LogLevel) {}

    /**
     * Isolate the first error from the params and return a clean LoggableParams.  This is needed
     * as Error object could be part of loggable entry array.
     * 
     * @param rest 
     * @returns 
     */
    private extractError(message: string | Error, rest: TLoggableEntry[]): [Error | undefined, TLoggableParam[]] {
        let errorIsSet = false;
        const result: TLoggableParam[] = [];

        let error: Error | undefined = undefined;
        
        // If message is of type Error, use that as error returned
        if (message instanceof Error) {
            error = message;
            errorIsSet = true;
        }

        // Parse input
        for (const entry of rest) {
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
     * Breakdown input params of logger into message, error and params
     * 
     * @param message 
     * @param rest 
     * @returns 
     */
    private handleLoggerInputParams(message: TLoggerMessageType, rest: TLoggableEntry[]): [
        string,
        Error | undefined,
        TLoggableParam[]
     ] {
        // Handle message as callback
        let actualMessage: TLoggerMessageTypeBase;
        if (typeof message === 'function') {
            try {
                actualMessage = message();
            } catch (ex) {
                if (ex instanceof Error) {
                    actualMessage = `log message callback threw error ${ex.message}`;
                } else {
                    actualMessage = `log message callback threw error ${ex}`;
                }
            }
            
        } else {
            actualMessage = message;
        }

        // Extract data to log from params
        const [errorToUse, parmsToUse] = this.extractError(actualMessage, rest);

        // Set the message and error to be set in the log entry
        let messageToUse: string;
        if (actualMessage instanceof Error) {
            messageToUse = actualMessage.message;
        } else {
            messageToUse = actualMessage;
        }

        return [
            messageToUse,
            errorToUse,
            parmsToUse
        ]
    }

    /**
     * Collapse all LoggableParams into a loggables and a data variables.  The first
     * entry in the list will prevail.  Intentionally not converting dup key to a
     * list as this could cause data type collision in system like logstash
     * 
     * **Note**: This method perform a shallow merge for data
     *
     * @param input 
     * @returns 
     */
    private extractData(input: TLoggableParam[]): {loggables: AbstractLoggable[], data: IJson, values: TJsonValue[]} {
        const loggables: AbstractLoggable[] = [];
        const data: IJson = {};
        const values: TJsonValue[] = [];

        for (const entry of input.reverse()) {
            if (entry instanceof AbstractLoggable) {
                loggables.push(entry);
            } else if (isObject(entry)) {
                // Merge incoming IJson into data
                mergeIJsonShallow(data, entry);
            } else {
                values.push(entry);
            }
        }

        return {loggables, data, values};
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
    protected log(severity: string | LogSeverity, message: TLoggerMessageType, ...rest: TLoggableEntry[]): void {
        const writer = LogWriter.getInstance();

        // skip any logging if no destination has been set
        if (!writer.hasDestination) {
            return;
        }

        const level = convertSeverityToLevel(severity) ?? DEFAULT_LOG_LEVEL;

        // Handle message as callback
        const [messageToUse, errorToUse, parmsToUse] = this.handleLoggerInputParams(message, rest)

        const entry: IJLogEntry = {
            name: this.name,
            severity,
            level,
            message: messageToUse,
            error: errorToUse,
            time: new Date()
        };

        // Add loggables and data
        const {loggables, data, values} = this.extractData(parmsToUse);
        
        if (!isEmpty(loggables)) {
            entry.loggables = loggables;
        }
        if (!isEmpty(data)) {
            entry.data = data;
        }
        if (!isEmpty(values)) {
            entry.values = values;
        }

        writer.write(entry, this.logLevel);
    }

    /** Write a {@link LogSeverity.DEBUG} severity log */
    public debug(message: TLoggerMessageType, ...rest: TLoggableEntry[]): void {
        this.log(LogSeverity.DEBUG, message, ...rest);
    }

    /** Write a {@link LogSeverity.INFO} severity log */
    public info(message: TLoggerMessageType, ...rest: TLoggableEntry[]): void {
        this.log(LogSeverity.INFO, message, ...rest);
    }

    /** Write a {@link LogSeverity.WARNING} severity log */
    public warn(message: TLoggerMessageType, ...rest: TLoggableEntry[]): void {
        this.log(LogSeverity.WARNING, message, ...rest);
    }

    /** Write a {@link LogSeverity.ERROR} severity log */
    public error(message: TLoggerMessageType, ...rest: TLoggableEntry[]): void {
        this.log(LogSeverity.ERROR, message, ...rest);
    }

    /** Write a {@link LogSeverity.PANIC} severity log */
    public panic(message: TLoggerMessageType, ...rest: TLoggableEntry[]): void {
        this.log(LogSeverity.PANIC, message, ...rest);
    }

    /**
     * If a async destination based on {@link AbstractAsyncLogDestination} exists, use
     * this method to wait for last log call complete.
     *
     * @param maxRetry number of time to retry.  Default to retry for 20 times.
     * @returns 
     */
    public async logWritten(maxRetry=20): Promise<void> {
        const writer = LogWriter.getInstance();
        return writer.waitProcessComplete(maxRetry);
    }
}

import {
    TJsonValue, IJson, DEFAULT_LOG_LEVEL,
    LogSeverity, LogLevel, convertSeverityToLevel,
    IJLogEntry, AbstractLoggable,
    mergeIJson
} from './core';

import {isEmpty, isObject} from './helper';
import {LogWriter} from './writer';
import {LoggableError} from './models';


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
     * Isolate the first error from the params and return a clean LoggableParams
     * 
     * @param input 
     * @returns 
     */
    private extractError(message: string | Error, input: TLoggableEntry[]): [Error | undefined, TLoggableParam[]] {
        let errorIsSet = false;
        const result: TLoggableParam[] = [];

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
                mergeIJson(data, entry);
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
    protected log(severity: string | LogSeverity, message: string | Error, ...rest: TLoggableEntry[]): void {
        const writer = LogWriter.getInstance();

        // skip any logging if no destination has been set
        if (!writer.hasDestination) {
            return;
        }

        const level = convertSeverityToLevel(severity) ?? DEFAULT_LOG_LEVEL;

        // Extract data to log from params
        const [error, params] = this.extractError(message, rest);

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
            time: new Date()
        };

        // Add loggables and data
        const {loggables, data, values} = this.extractData(params);
        
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
    public debug(message: string | Error, ...rest: TLoggableEntry[]): void {
        this.log(LogSeverity.DEBUG, message, ...rest);
    }

    /** Write a {@link LogSeverity.INFO} severity log */
    public info(message: string | Error, ...rest: TLoggableEntry[]): void {
        this.log(LogSeverity.INFO, message, ...rest);
    }

    /** Write a {@link LogSeverity.WARNING} severity log */
    public warn(message: string | Error, ...rest: TLoggableEntry[]): void {
        this.log(LogSeverity.WARNING, message, ...rest);
    }

    /** Write a {@link LogSeverity.ERROR} severity log */
    public error(message: string | Error, ...rest: TLoggableEntry[]): void {
        this.log(LogSeverity.ERROR, message, ...rest);
    }

    /** Write a {@link LogSeverity.PANIC} severity log */
    public panic(message: string | Error, ...rest: TLoggableEntry[]): void {
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

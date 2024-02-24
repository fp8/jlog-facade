import {
    AbstractLogDestination, AbstractLoggable, IJLogEntry,
    IJson, LogLevel, mergeIJsonShallow, TJsonValue
} from "./core";
import { mergeLoggableModels } from './models';
import { isEmpty, safeStringify } from "./helper";
import { LoggerFactory } from "./factory";

export interface ISimpleJsonOutput extends IJson {
    t: string; // time
    m: string; // 1 char severity + message
    e?: string; // error message
}

/**
 * Merge extra attributes from JLogEntry (loggables, data and values) into a single Json.  In this case,
 * the keys in loggables takes priority over those in data; ie, the key in loggable will always overwrite
 * those in data.
 * 
 * defaultPayload when passed takes precedence on all other entires.
 * 
 * @param loggables 
 * @param data 
 * @param defaultPayload 
 * @param values 
 * @returns 
 */
export function buildOutputDataForDestination(loggables?: AbstractLoggable[], data?: IJson, defaultPayload?: IJson, values?: TJsonValue[]): IJson {
    let output: IJson;
    if (data === undefined) {
        output = {};
    } else {
        output = Object.assign({}, data);
    }

    // Check if value exists
    const outputValues: TJsonValue[] = [];
    if (values !== undefined) {
        outputValues.push(...values);
    }

    // Process loggables
    if (loggables !== undefined) {
        const {loggableJson, loggableValues} = mergeLoggableModels(...loggables);
        mergeIJsonShallow(output, loggableJson);
        if (!isEmpty(loggableValues)) {
            outputValues.push(...loggableValues);
        }
    }

    // Process defaultPayload
    if (defaultPayload !== undefined) {
        mergeIJsonShallow(output, defaultPayload);
    }

    // Add values to the output
    if (!isEmpty(outputValues)) {
        output.values = outputValues;
    }

    return output;
}

/**
 * Helper class to be used for `.use` static method for a AbstractLogDestination
 *
 * @param type 
 * @param level 
 * @param filters 
 * @returns 
 */
export function useDestination<T extends AbstractLogDestination>(
    type: {new(level?: LogLevel): T ;},
    level?: string | LogLevel, filters?: string[]
): T {
    let destination: T;

    if (filters === undefined) {
        filters = [];
    }

    if (typeof level === 'string') {
        // Level is not passed so `level` param is the first entry of filters
        destination = new type();
        destination.appendLoggerNameFilter(level, ...filters);
    } else {
        destination = new type(level);
        destination.appendLoggerNameFilter(...filters);
    }
    
    LoggerFactory.addLogDestination(destination);
    return destination;
}


/**
 * A minimalistic json based destination that will output json in the following sequence:
 * 
 * - `t`: time of the log in the ISO format
 * - `m`: message that start with first char of severity + `|` + log message
 * - `e`: error message if Error object passed
 * - `s`: error stack trace (unless `logStackTrace` set to false)
 * - other payload sent to the logger
 */
export class SimpleJsonDestination extends AbstractLogDestination {
    /**
     * Add this destination to LoggerFactory.  Usage:
     * 
     * Use default or configured setting from logger.json
     * 
     * - `SimpleJsonDestination.use());`
     * 
     * Set both level and logger name filter
     * 
     * - `SimpleJsonDestination.use(LogLevel.INFO, 'my-logger');`
     *  
     * Set only logger name filter
     * 
     * - `SimpleJsonDestination.use('my-logger', 'another-logger');`
     * 
     * @param level 
     * @param filters 
     * @returns 
     */
    public static use(level?: string | LogLevel, ...filters: string[]): SimpleJsonDestination {
        return useDestination(SimpleJsonDestination, level, filters);
    }

    constructor(level?: LogLevel, private logStackTrace = true) {
        super(level);
    }

    protected formatOutput(entry: IJLogEntry, _loggerLevel?: LogLevel, defaultPayload?: IJson): ISimpleJsonOutput {
        const data = buildOutputDataForDestination(entry.loggables, entry.data, defaultPayload, entry.values);

        let stack: string | undefined = undefined;
        if (this.logStackTrace && entry.error) {
            stack = entry.error.stack?.toString();
        }

        return {
            t: entry.time.toISOString(),
            m: `${entry.severity.toUpperCase().charAt(0)}|${entry.message}`,
            e: entry.error?.toString(),
            s: stack,
            ...data
        };
    }

    override write(entry: IJLogEntry, loggerLevel?: LogLevel, defaultPayload?: IJson): void {
        this._write(entry, loggerLevel, defaultPayload);
        console.log(
            safeStringify(this.formatOutput(entry, loggerLevel, defaultPayload))
        );
    }
}

/**
 * A minimalistic text based destination that output using following format:
 * 
 * - `<timestamp in ISO>|<1st char of severity> <message> [<Error name>:<Error message>] [{"key": "value", ...}]`
 * 
 * E.g.:
 * 
 * - `2022-11-02T19:51:55.436Z|I This is a info message`
 * - `2022-11-02T19:51:55.438Z|E Create company failed [BadRequest:Missing vat number] {"name":"ACME Inc"}`
 */
export class SimpleTextDestination extends AbstractLogDestination {
    /**
     * Add this destination to LoggerFactory.  Usage:
     * 
     * Use default or configured setting from logger.json
     * 
     * - `SimpleJsonDestination.use());`
     * 
     * Set both level and logger name filter
     * 
     * - `SimpleJsonDestination.use(LogLevel.INFO, 'my-logger');`
     *  
     * Set only logger name filter
     * 
     * - `SimpleJsonDestination.use('my-logger', 'another-logger');`
     * 
     * @param level 
     * @param filters 
     * @returns 
     */
    public static use(level?: string | LogLevel, ...filters: string[]): SimpleTextDestination {
        return useDestination(SimpleTextDestination, level, filters);
    }

    // ToDo: add support for loggerLevel
    protected formatOutput(entry: IJLogEntry, _loggerLevel?: LogLevel, defaultPayload?: IJson): string {
        const header = `${entry.time.toISOString()}|${entry.severity.toUpperCase().charAt(0)}`;

        // Error
        let error = '';
        if (entry.error && entry.message !== entry.error.message) {
            error = ` [${entry.error.name}:${entry.error.message}]`;
        }

        // Create a clone of data
        const merged = buildOutputDataForDestination(entry.loggables, entry.data, defaultPayload, entry.values);
        let data = '';
        if (!isEmpty(merged)) {
            data = ` ${safeStringify(merged)}`;
        }

        return `${header} ${entry.message}${error}${data}`;
    }

    override write(entry: IJLogEntry, loggerLevel?: LogLevel, defaultPayload?: IJson): void {
        this._write(entry, loggerLevel, defaultPayload);
        console.log(this.formatOutput(entry, loggerLevel, defaultPayload));
    }
}

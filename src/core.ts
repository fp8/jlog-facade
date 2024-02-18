// ROOT LEVEL PACKAGE -- Allowed to import only from STAND-ALONE packages from this project
import * as fs from 'fs';
import {isArray, localError, localDebug, isObject} from './helper';



/**
 * Allowed Json Value Type
 */
export type TJsonValue = string | number | boolean | IJson | null | undefined;

/**
 * Json Interface
 */
export interface IJson {
    [key: string]: TJsonValue | TJsonValue[]
}

/**
 * Type of value that can be written to logger
 */
export type TLoggableValue = TJsonValue | AbstractLoggable;

/**
 * Supported log severity.
 */
export enum LogSeverity {
    DEBUG = 'debug',
    INFO = 'info',
    WARNING = 'warn',
    ERROR = 'error',
    PANIC = 'panic',
    OFF = 'off'
}

/**
 * Supported numeric log level.  Used the same number as
 * [GCloud's LogSeverity](https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#LogSeverity).
 */
export enum LogLevel {
    DEBUG = 100,
    INFO = 200,
    WARNING = 400,
    ERROR = 500,
    PANIC = 800,
    OFF = 999_999
}

/**
 * The default log level if level or severity is not provided.
 */
export const DEFAULT_LOG_LEVEL = LogLevel.INFO;

/**
 * Translate LogSeverity to LogLevel.  Severity is case insensitive
 * 
 * @param input 
 * @returns 
 */
export function convertSeverityToLevel(input?: string | LogSeverity): LogLevel | undefined {
    // NOTE: this function cannot be in helper as it has dependency from core.ts

    switch(input?.toLowerCase()) {
        case LogSeverity.DEBUG:
        case 'debug':
            return LogLevel.DEBUG;

        case LogSeverity.INFO:
        case 'info':
            return LogLevel.INFO;
        
        case LogSeverity.WARNING:
        case 'warning':
        case 'warn':
            return LogLevel.WARNING;
        
        case LogSeverity.ERROR:
        case 'error':
            return LogLevel.ERROR;

        case LogSeverity.PANIC:
        case 'panic':
            return LogLevel.PANIC;

        case LogSeverity.OFF:
        case 'off':
            return LogLevel.OFF;
        default:
            return undefined;
    }
}

/**
 * A log entry.  The `level` is translated from `severity` using value defined by {@link LogLevel}.
 * If a specific `severity` is not found, it will be set to `INFO = 200`.
 */
export interface IJLogEntry {
    /** Logger name */
    name: string,
    /** Logger level */
    level: number,
    /** Logger severity */
    severity: string,
    /** output message */
    message: string,
    /** error object */
    error?: Error,
    /** all AbstractLoggables */
    loggables?: AbstractLoggable[],
    /** additional attributes to log */
    data?: IJson,
    /** any value logged */
    values?: TJsonValue[],
    /** timestamp of the log */
    time: Date
}

/**
 * Loggable is a class that can be added to the log and can be converted into a IJson
 */
export abstract class AbstractLoggable {
    abstract toIJson(): IJson
}

export abstract class AbstractBaseDestination {
    protected _logNameFilter: string[] | undefined;
    protected _logInterceptor: ((entry: IJLogEntry, loggerLevel?: LogLevel, defaultPayload?: IJson) => void) | undefined = undefined;

    constructor(public readonly level?: LogLevel) {}

    public appendLoggerNameFilter(...filters: string[]): void {
        if (filters.length) {
            if (this._logNameFilter === undefined) {
                this._logNameFilter = filters;
            } else {
                this._logNameFilter.push(...filters);
            }
        }
    }

    public get filters(): string[] | undefined {
        return this._logNameFilter;
    }

    public clearLoggerNameFilter(): AbstractBaseDestination {
        this._logNameFilter = undefined;
        return this;
    }

    /**
     * Set log interceptor to capture the log written
     *
     * @param callback 
     */
    public setLogInterceptor(callback: (entry: IJLogEntry, loggerLevel?: LogLevel, defaultPayload?: IJson) => void): AbstractBaseDestination {
        this._logInterceptor = callback;
        return this;
    }

    /**
     * Clear the log interceptor
     */
    public clearLogInterceptor(): AbstractBaseDestination {
        this._logInterceptor = undefined;
        return this;
    }

    /**
     * This method must be called by the subclass to write the log entry.  It cannot be automated as the
     * basic design of the log destination is to allow the subclass' `.write` method to return different
     * type of value depending on the implementation.
     *
     * @param entry 
     * @param loggerLevel 
     * @param defaultPayload 
     */
    protected _write(entry: IJLogEntry, loggerLevel?: LogLevel, defaultPayload?: IJson): void {
        if (this._logInterceptor) {
            this._logInterceptor(entry, loggerLevel, defaultPayload);
        }
    }
}

/**
 * A log destination that will write to output synchronously
 */
export abstract class AbstractLogDestination extends AbstractBaseDestination {
    abstract write(entry: IJLogEntry, loggerLevel?: LogLevel, defaultPayload?: IJson): void;
}

/**
 * A log destination that will write to output asynchronously
 */
export abstract class AbstractAsyncLogDestination extends AbstractBaseDestination {
    abstract write(entry: IJLogEntry, loggerLevel?: LogLevel, defaultPayload?: IJson): Promise<void>;
}

/**
 * Transform a loggable value into a TJsonValue
 *
 * @param input 
 * @returns 
 */
function convertLoggableValueToJsonValue(input: TLoggableValue): TJsonValue {
    if (input instanceof AbstractLoggable) {
        return input.toIJson();
    } else {
        return input;
    }
}

/**
 * Transform a loggable value into a TJsonValue, handling case where input is an array
 *
 * @param input 
 * @returns 
 */
export function convertLoggableValueToIJson(input: TLoggableValue | TLoggableValue[]): TJsonValue | TJsonValue[] {
    if (isArray(input)) {
        return input.map(
            entry => convertLoggableValueToJsonValue(entry)
        )
    } else {
        return convertLoggableValueToJsonValue(input);
    }
}

/**
 * Transform any data input into a json value
 *
 * @param input 
 * @returns 
 */
export function convertToJsonValue(input: unknown | unknown[]): TJsonValue | TJsonValue[] | undefined {
    let result: TJsonValue | TJsonValue[] | undefined = undefined;

    if (input === null || input === undefined || typeof input === 'function') {
        result = undefined;
    } else if (input instanceof AbstractLoggable) {
        result = convertLoggableValueToJsonValue(input);
    } else if (isObject(input)) {
        try {
            result = JSON.parse(JSON.stringify(input));
        } catch (err) {
            localDebug(() => `Failed to convert ${input} to JSON: ${err}`);
        }

        if (result === undefined) {
            try {
                result = input.toString();
            } catch (err) {
                localDebug(() => `Failed to convert ${input} to string: ${err}`);
            }
        }
    } else if (isArray(input)) {
        // Array needs to be flatterned
        const arr: TJsonValue[] = [];

        for (const entry of input) {
            const inner = convertToJsonValue(entry);
            if (isArray(inner)) {
                inner.forEach(innerEntry => arr.push(innerEntry));
            } else {
                arr.push(inner);
            }
        }

        result = arr;
    } else if (
        typeof input === 'string'
        || typeof input === 'number'
        || typeof input === 'boolean'
    ) {
        result = input;
    }

    return result;
}


/**
 * Method used to merge 2 IJson object, from `input` into `cummulator`.
 * 
 * Note: perform shallow copy
 *
 * @param input source IJson
 * @param cummulator destination IJson
 */
export function mergeIJsonShallow(cummulator: IJson, ...values: IJson[]): void {
    // Merge incoming IJson into data
    for (const entry of values) {
        for (const [key, value] of Object.entries(entry)) {
            cummulator[key] = value;
        }
    }
}

export function loadJsonFile(filepath: string): IJson | undefined {
    if (!filepath.endsWith('.json')) {
        localDebug(`loadJsonFile not loading ${filepath} as it doesn't end with .json`);
        return undefined;
    }

    let loaded: IJson;
    try {
        const content = fs.readFileSync(filepath, {encoding: 'utf8'});
        localDebug(`Config from logger.json: ${content}`);
        loaded = JSON.parse(content);
    } catch(e) {
        localError(`Failed to load json file ${filepath}`, e as Error);
        return undefined;
    }

    return loaded;
}

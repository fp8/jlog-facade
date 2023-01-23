// ROOT LEVEL PACKAGE -- Allowed to import only from STAND-ALONE packages from this project
import {isArray} from './helper';

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
    PANIC = 'panic'
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
    PANIC = 800
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

/**
 * A log destination that will write to output synchronously
 */
export abstract class AbstractLogDestination {
    abstract write(entry: IJLogEntry): void;
}

/**
 * A log destination that will write to output asynchronously
 */
export abstract class AbstractAsyncLogDestination {
    abstract write(entry: IJLogEntry): Promise<void>;
}

/**
 * Transform a loggable value into a TJsonValue
 *
 * @param input 
 * @returns 
 */
function convertValueToJsonValue(input: TLoggableValue): TJsonValue {
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
export function convertValueToIJson(input: TLoggableValue | TLoggableValue[]): TJsonValue | TJsonValue[] {
    if (isArray(input)) {
        return input.map(
            entry => convertValueToJsonValue(entry)
        )
    } else {
        return convertValueToJsonValue(input);
    }
}

/**
 * Method used to merge 2 IJson object, from `input` into `cummulator`.
 *
 * @param input source IJson
 * @param cummulator destination IJson
 */
export function mergeIJson(cummulator: IJson, ...values: IJson[]) {
    // Merge incoming IJson into data
    for (const entry of values) {
        for (const [key, value] of Object.entries(entry)) {
            cummulator[key] = value;
        }
    }
}

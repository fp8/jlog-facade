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
 * Default log levels.  These value must be supported for all caller
 */
export const DEBUG = 'debug';
export const INFO = 'info';
export const WARNING = 'warn';
export const ERROR = 'error';
export const PANIC = 'panic';

export const DEFAULT_LOG_LEVELS = [PANIC, ERROR, WARNING, INFO, DEBUG];

/**
 * A log entry
 */
export interface IJLogEntry {
    /** Logger name */
    name: string,
    /** Logger level */
    level: string,
    /** output message */
    message: string,
    /** error object */
    error?: Error,
    /** additional attributes to log */
    data: IJson,
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

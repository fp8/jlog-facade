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
    message?: string,
    /** error object */
    error?: Error,
    /** additional attributes to log */
    data: IJson,
    /** timestamp of the log */
    time: Date
}

export interface ILogDestination {
    readonly isAsync: boolean;
}


export abstract class AbstractLogDestination {
    abstract write(entry: IJLogEntry): void;
}

export abstract class AbstractAsyncLogDestination {
    abstract write(entry: IJLogEntry): Promise<void>;
}
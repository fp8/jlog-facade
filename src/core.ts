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
 * Default log severity.
 */
export enum LogSeverity {
    DEBUG = 'debug',
    INFO = 'info',
    WARNING = 'warn',
    ERROR = 'error',
    PANIC = 'panic'
}

/**
 * Default log numeric level.  Used the same number as
 * [GCloud's LogSeverity](https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#LogSeverity)
 */
export enum LogLevel {
    DEBUG = 100,
    INFO = 200,
    WARNING = 400,
    ERROR = 500,
    PANIC = 800
}

/**
 * A log entry
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

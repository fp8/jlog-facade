// ROOT LEVEL PACKAGE -- Allowed to import only from STAND-ALONE packages from this project
import * as fs from 'fs';
import * as nodePath from 'path';
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
 * Translate LogSeverity to LogLevel.  Severity is case insensitive
 * 
 * @param input 
 * @returns 
 */
export function convertSeverityToLevel(input?: string | LogSeverity): LogLevel | undefined {
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

type TLoggerConfigOverride = {[loggerName: string]: LogLevel};

/**
 * Expected output from logger.json file
 */
export class LoggerConfig {
    level: LogLevel;
    override: TLoggerConfigOverride;

    private parseLevel(configSeverity: TJsonValue | TJsonValue[]): LogLevel {
        let level = LogLevel.INFO; 

        // Extract .severity
        if (typeof configSeverity === 'string') {
            const configLevel = convertSeverityToLevel(configSeverity);
            if (configLevel !== undefined) {
                level = configLevel;
            }
        }

        return level;
    }

    private parseOverride(configFilters: TJsonValue | TJsonValue[]): TLoggerConfigOverride {
        const filters: TLoggerConfigOverride = {};

        // Extract .severity
        if (isObject(configFilters)) {
            for (const [loggerName, severity] of Object.entries(configFilters)) {
                if (typeof severity === 'string') {
                    const level = convertSeverityToLevel(severity);
                    if (level !== undefined) {
                        filters[loggerName] = level;
                    } else {
                        localDebug(`parseOverride failed to translate severity of ${severity}.  Skipped override of ${loggerName} loggerName`);
                    }
                } else {
                    localDebug(`parseOverride received a non-string severity of ${severity}.  Skipped override of ${loggerName} loggerName`);
                }
            }
        }

        return filters;
    }

    constructor(input: IJson, public readonly configDir?: string) {
        this.level = this.parseLevel(input.severity);
        this.override = this.parseOverride(input.override);
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
    protected _level: LogLevel;
    protected _logNameFilter: string[] = [];

    constructor(level?: LogLevel) {
        this._level = level ?? LogLevel.INFO;
    }

    public setLoggerNameFilter(...filter: string[]): void {
        this._logNameFilter = filter;
    }

    protected _writeNeeded(entry: IJLogEntry): boolean {
        return entry.level >= this._level;
    }
}


/**
 * A log destination that will write to output synchronously
 */
export abstract class AbstractLogDestination extends AbstractBaseDestination {
    abstract _write(entry: IJLogEntry): void;

    write(entry: IJLogEntry): void {
        if (this._writeNeeded(entry)) {
            this._write(entry);
        }
    }
}

/**
 * A log destination that will write to output asynchronously
 */
export abstract class AbstractAsyncLogDestination extends AbstractBaseDestination {
    abstract _write(entry: IJLogEntry): Promise<void>;

    async write(entry: IJLogEntry): Promise<void> {
        if (this._writeNeeded(entry)) {
            await this._write(entry);
        }
    }
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

/**
 * 
 * @returns 
 */
export function readLoggerConfig(env?: string): LoggerConfig {
    // Set paths to find the logger.json file
    const fp8env = env ?? process.env.FP8_ENV ?? 'local';
    const paths = [
        `./etc/${fp8env}/logger.json`,
        './etc/logger.json',
        `./config/${fp8env}/logger.json`,
        './config/logger.json'
    ];

    // Return first config found from configured paths
    let configDir: string | undefined;
    let config: IJson = {};
    for (const path of paths) {
        localDebug(`Looking for logger.json at ${path}`);
        if (fs.existsSync(path)) {
            const jsonFile = loadJsonFile(path);
            if (jsonFile !== undefined) {
                config = jsonFile;
                configDir = nodePath.dirname(path);
                break;
            }
        }
    }

    // Return 
    return new LoggerConfig(config, configDir);
}

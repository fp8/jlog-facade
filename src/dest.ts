import {
    AbstractLogDestination, AbstractLoggable, IJLogEntry,
    IJson, LogLevel, mergeIJson, TJsonValue,
    LoggerConfig
} from "./core";
import { mergeLoggableModels } from './models';
import { isEmpty } from "./helper";
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
 * @param loggables 
 * @param data 
 * @param values 
 * @returns 
 */
export function buildOutputDataForDestination(loggables?: AbstractLoggable[], data?: IJson, values?: TJsonValue[]): IJson {
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
        mergeIJson(output, loggableJson);
        if (!isEmpty(loggableValues)) {
            outputValues.push(...loggableValues);
        }
    }

    // Add values to the output
    if (!isEmpty(outputValues)) {
        output.values = outputValues;
    }

    return output;
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
    public static use(level?: LogLevel, ...filter: string[]): void {

    }

    constructor(level?: LogLevel, private logStackTrace = true) {
        super(level);
    }

    protected formatOutput(entry: IJLogEntry): ISimpleJsonOutput {
        const data = buildOutputDataForDestination(entry.loggables, entry.data, entry.values);

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

    override _write(entry: IJLogEntry): void {
        console.log(
            JSON.stringify(this.formatOutput(entry))
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
    protected formatOutput(entry: IJLogEntry): string {
        const header = `${entry.time.toISOString()}|${entry.severity.toUpperCase().charAt(0)}`;

        // Error
        let error = '';
        if (entry.error && entry.message !== entry.error.message) {
            error = ` [${entry.error.name}:${entry.error.message}]`;
        }

        // Create a clone of data
        const merged = buildOutputDataForDestination(entry.loggables, entry.data, entry.values);
        let data = '';
        if (!isEmpty(merged)) {
            data = ` ${JSON.stringify(merged)}`;
        }

        return `${header} ${entry.message}${error}${data}`;
    }

    override _write(entry: IJLogEntry): void {
        console.log(this.formatOutput(entry));
    }
}

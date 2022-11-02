import { AbstractLogDestination, IJLogEntry, IJson } from "./core";
import { isEmpty } from "./helper";

export interface ISimpleJsonOutput extends IJson {
    t: string; // time
    m: string; // 1 char severity + message
    e?: string; // error message
}

/**
 * A minimalistic json based destination that will output json in the following sequence:
 * 
 * - `t`: time of the log in the ISO format
 * - `m`: message that start with first char of severity + `|` + log message
 * - `e`: error message if Error object passed
 * - other payload sent to the logger
 */
export class SimpleJsonDestination extends AbstractLogDestination {
    protected formatOutput(entry: IJLogEntry): ISimpleJsonOutput {
        // Create a clone of data
        const data: IJson = Object.assign({}, entry.data);

        return {
            t: entry.time.toISOString(),
            m: `${entry.severity.toUpperCase().charAt(0)}|${entry.message}`,
            e: entry.error?.message,
            ...data
        };
    }

    override write(entry: IJLogEntry): void {
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
        let data = '';
        if (!isEmpty(entry.data)) {
            data = ` ${JSON.stringify(entry.data)}`;
        }

        return `${header} ${entry.message}${error}${data}`;
    }

    override write(entry: IJLogEntry): void {
        console.log(this.formatOutput(entry));
    }
}
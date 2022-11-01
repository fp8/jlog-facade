import {
    DEBUG, INFO, WARNING, ERROR, PANIC,
    IJLogEntry, IJson,
    AbstractLoggable
} from './core';

import {LogWriter} from './writer';
import {LoggableError} from './models';

export type TLoggableParams = AbstractLoggable | IJson;
export type TLoggableEntries = Error | TLoggableParams;

export class JLogger {
    constructor(private name: string) {};

    /**
     * Isolate the first error from the params and return a clean LoggableParams
     * 
     * @param input 
     * @returns 
     */
    private extractError(message: string | Error, input: TLoggableEntries[]): [Error | undefined, TLoggableParams[]] {
        let errorIsSet = false;
        const result: TLoggableParams[] = [];

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
     * Collapse all LoggableParams into a single IJson
     *
     * @param input 
     * @returns 
     */
    private mergeParams(input: TLoggableParams[]): IJson {
        const entries = input.map(entry => {
            if (entry instanceof AbstractLoggable) {
                return entry.toIJson();
            } else {
                return entry;
            }
        });

        return Object.assign({}, ...entries);
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
    protected log(level: string, message: string | Error, ...rest: TLoggableEntries[]): void {
        const writer = LogWriter.getInstance();

        // skip any logging if no destination has been set
        if (!writer.hasDestination) {
            return;
        }

        // Extract data to log from params
        const [error, params] = this.extractError(message, rest);
        const data = this.mergeParams(params);

        // Set the message and error to be set in the log entry
        let messageToUse: string;
        if (message instanceof Error) {
            messageToUse = message.message;
        } else {
            messageToUse = message;
        }

        const entry: IJLogEntry = {
            name: this.name,
            level,
            message: messageToUse,
            error,
            data,
            time: new Date()
        };

        writer.write(entry);
    }

    public debug(message: string | Error, ...rest: TLoggableEntries[]) {
        this.log(DEBUG, message, ...rest);
    }

    public info(message: string | Error, ...rest: TLoggableEntries[]) {
        this.log(INFO, message, ...rest);
    }

    public warn(message: string | Error, ...rest: TLoggableEntries[]) {
        this.log(WARNING, message, ...rest);
    }

    public error(message: string | Error, ...rest: TLoggableEntries[]) {
        this.log(ERROR, message, ...rest);
    }

    public panic(message: string | Error, ...rest: TLoggableEntries[]) {
        this.log(PANIC, message, ...rest);
    }

    public async waitProcessComplete(maxRetry: number = 20): Promise<void> {
        const writer = LogWriter.getInstance();
        return writer.waitProcessComplete(maxRetry);
    }
}

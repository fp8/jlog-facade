import {
    DEBUG, INFO, WARNING, ERROR, PANIC,
    IJLogEntry, IJson
} from './core';
import {AbstractILoggable} from './models';
import {LogStream} from './writer';

export type TLoggableParams = AbstractILoggable | IJson;
export type TLoggableEntries = Error | TLoggableParams;

export class JLogger {
    private stream = new LogStream();

    constructor(private name: string) {};

    /**
     * Isolate the first error from the params and return a clean LoggableParams
     * 
     * @param input 
     * @returns 
     */
    private extractError(input: TLoggableEntries[]): [Error | undefined, TLoggableParams[]] {
        let error: Error | undefined = undefined;
        const result: TLoggableParams[] = [];

        for (const entry of input) {
            if (entry instanceof Error) {
                // Only use the first error from the list
                if (error === undefined) {
                    error = entry;
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
    private generateData(input: TLoggableParams[]): IJson {
        const entries = input.map(entry => {
            if (entry instanceof AbstractILoggable) {
                return entry.toIJson();
            } else {
                return entry;
            }
        });

        return Object.assign({}, ...entries);
    }

    /**
     * The main logging method that actually write to the log
     *
     * @param level 
     * @param message 
     * @param rest 
     */
    protected log(level: string, message?: string, ...rest: TLoggableEntries[]): void {
        const [error, params] = this.extractError(rest);
        const data = this.generateData(params)

        if (message === undefined) {
            if ('message' in data) {
                message = data.message?.toString();
                delete data.message;
            }
        }

        const entry: IJLogEntry = {
            name: this.name,
            level,
            message,
            error,
            data,
            time: new Date()
        };
        this.stream.write(entry);
    }

    public debug(message: string, ...rest: TLoggableEntries[]) {
        this.log(DEBUG, message, ...rest);
    }

    public info(message: string, ...rest: TLoggableEntries[]) {
        this.log(INFO, message, ...rest);
    }

    public warn(message: string, ...rest: TLoggableEntries[]) {
        this.log(WARNING, message, ...rest);
    }

    public error(message: string, ...rest: TLoggableEntries[]) {
        this.log(ERROR, message, ...rest);
    }

    public panic(message: string, ...rest: TLoggableEntries[]) {
        this.log(PANIC, message, ...rest);
    }

    private async delay(milli: number): Promise<void> {
        return new Promise((resolve, _) => {
            setTimeout(resolve, milli);
        });
    }

    public async waitCurrentWrite(maxRetry: number = 10): Promise<void> {
        let retry = 0;
        let looking = true;
        
        while (looking || retry < maxRetry) {
            retry += 1;
            if (this.stream.isProcessing) {
                await this.delay(100);
            } else {
                looking = false;
            }
        }
    }
}
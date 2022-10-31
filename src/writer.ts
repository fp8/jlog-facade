import {Writable, WritableOptions} from 'stream';

import { IJLogEntry, AbstractLogDestination, AbstractAsyncLogDestination } from "./core";


/**
 * Datatype for storing all log destinations
 */
type TLogDestinations = { [name: string]: AbstractLogDestination | AbstractAsyncLogDestination }

const DEFAULT_LOG_DESTINATION_NAME = 'default';

/**
 * INTERNAL: A global singleton class that handle passing of ILogEntry from Logger to LogDestination
 */
export class LogDestinations {
    private static instance: LogDestinations | undefined = undefined;

    private readonly destinations : TLogDestinations = {};

    private constructor() {};

    public static getInstance(): LogDestinations {
        if (LogDestinations.instance === undefined) {
            LogDestinations.instance = new LogDestinations();
        }
        return LogDestinations.instance;
    }

    /**
     * Add a log destination to write output
     * @param destination 
     * @param name 
     */
    public addDestination(destination: AbstractLogDestination | AbstractAsyncLogDestination, name?: string): void {
        if (name === undefined) {
            name = DEFAULT_LOG_DESTINATION_NAME;
        }
        this.destinations[name] = destination;
    }

    /**
     * Clear a specific destination
     *
     * @param name 
     */
    public removeDestination(name?: string): void {
        if (name === undefined) {
            name = DEFAULT_LOG_DESTINATION_NAME;
        }
        if (name in this.destinations) {
            delete this.destinations[name];
        }
    }

    /**
     * Clear all log destinations
     */
    public clearDestinatios(): void {
        Object.keys(this.destinations).forEach(
            key => delete this.destinations[key]
        )
    }

    /**
     * Async method to write all outputs
     *
     * @param entry 
     */
    public async write(entry: IJLogEntry): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const [_, destination] of Object.entries(this.destinations)) {
            if (destination instanceof AbstractAsyncLogDestination) {
                promises.push(destination.write(entry));
            } else {
                destination.write(entry);
            }
        }
        await Promise.all(promises);
    }
}

/**
 * 
 */
export class LogStream extends Writable {
    private writting: boolean = false;

    constructor() {
        const options: WritableOptions = {
            objectMode: true
        }
        super(options);
    }

    override _write(chunk: IJLogEntry, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
        this.writting = true
        const dests = LogDestinations.getInstance();
        
        dests.write(chunk)
            .then(() => {
                callback(undefined);
                this.writting = false;
            })
            .catch((err) => {
                console.error('FAILED TO WRITE LOG: ', err);
                this.writting = false;
            })
        ;
    }

    get isProcessing(): boolean {
        return this.writting;
    }
}

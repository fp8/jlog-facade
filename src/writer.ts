import type {Writable} from 'stream';
import * as Helper from './helper';

import {
    IJLogEntry, AbstractLogDestination, AbstractAsyncLogDestination
} from "./core";

/**
 * Datatype for storing all log destinations
 */
export type TLogDestination = AbstractLogDestination | AbstractAsyncLogDestination | Writable;
type TLogDestinations = { [name: string]: TLogDestination }

const DEFAULT_LOG_DESTINATION_NAME = 'default';

/**
 * INTERNAL: A global singleton class that handle passing of ILogEntry from Logger to LogDestination
 */
export class LogWriter {
    private static instance: LogWriter | undefined = undefined;

    private readonly destinations : TLogDestinations = {};
    private processing = false;

    private constructor() {}

    public static getInstance(): LogWriter {
        if (LogWriter.instance === undefined) {
            LogWriter.instance = new LogWriter();
        }
        return LogWriter.instance;
    }

    /**
     * Add a log destination to write output
     * @param destination 
     * @param name 
     */
    public addDestination(destination: TLogDestination, name?: string): void {
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
    public clearDestinations(): void {
        Object.keys(this.destinations).forEach(
            key => delete this.destinations[key]
        )
    }

    /**
     * Check if destination has been set
     */
    public get hasDestination(): boolean {
        return !Helper.isEmpty(this.destinations);
    }

    /**
     * Async method to write all outputs
     *
     * @param entry 
     */
    public async write(entry: IJLogEntry): Promise<void> {
        const promises: Promise<void>[] = [];
        this.processing = true;

        try {
            for (const [_, destination] of Object.entries(this.destinations)) {
                if (destination instanceof AbstractAsyncLogDestination) {
                    promises.push(destination.write(entry));
                } else {
                    /*
                    destination in this case could be either AbstractLogDestination or Writable,
                    both with .write method
                    */
                    destination.write(entry);
                }
            }
            await Promise.all(promises);
        } catch (err) {
            Helper.localError('LogWriter.write failed', err as Error);
        }

        this.processing = false;
    }

    /**
     * Wait for processing, which retry is 50 milliseconds, default for retry is 20x
     * so wait for 1 second
     */
    public async waitProcessComplete(maxRetry=20): Promise<void> {
        let retry = 0;
        let looking = true;
        
        while (looking || retry < maxRetry) {
            retry += 1;
            if (this.processing) {
                await Helper.delay(50);
            } else {
                looking = false;
            }
        }
    }
}

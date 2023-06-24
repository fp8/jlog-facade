import type {Writable} from 'stream';
import {isEmpty, delay, localError} from './helper';

import {
    IJLogEntry, AbstractLogDestination, AbstractAsyncLogDestination, LogLevel, AbstractBaseDestination
} from "./core";

import { LoggerConfig, readLoggerConfig, IisWriteNeededParams} from './config';


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

    protected config: LoggerConfig = readLoggerConfig();
    protected readonly destinations : TLogDestinations = {};
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
            if (destination instanceof AbstractBaseDestination) {
                name = destination.constructor.name;
            } else {
                name = DEFAULT_LOG_DESTINATION_NAME;
            }
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
        return !isEmpty(this.destinations);
    }

    /**
     * Async method to write all outputs
     *
     * @param entry 
     */
    public async write(entry: IJLogEntry, loggerLevel: LogLevel | undefined): Promise<void> {
        const promises: Promise<void>[] = [];

        // This flag is used to turn async into a sync method
        this.processing = true;

        try {
            for (const [destinationName, destination] of Object.entries(this.destinations)) {
                // Create the the params needed to check if log is needed
                const params: IisWriteNeededParams = {
                    loggerLevel,
                    destinationName
                };

                if (destination instanceof AbstractBaseDestination) {
                    params.destinationLevel = destination.level;
                    params.destinationFilters = destination.filters;
                }

                // If log is not needed, skip this destination
                if (!this.config.isWriteNeeded(entry, params)) {
                    continue;
                }

                // Write log
                if (destination instanceof AbstractAsyncLogDestination) {
                    promises.push(destination.write(entry, loggerLevel, this.config.defaultPayload));
                } else if (destination instanceof AbstractLogDestination) {
                    destination.write(entry, loggerLevel, this.config.defaultPayload);
                } else {
                    // If writable
                    // TODO: implement writeLog check based on loggerName and level
                    destination.write(entry);
                }
            }
            await Promise.all(promises);
        } catch (err) {
            localError('LogWriter.write failed', err as Error);
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
                await delay(50);
            } else {
                looking = false;
            }
        }
    }

    /**
     * Reload the config.  This is created for testing purpose.
     * 
     * @param env 
     */
    public _reloadConfig(env?: string): void {
        this.config = readLoggerConfig(env);
    }
}

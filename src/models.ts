import {
    TJsonValue, IJson,
    AbstractLoggable
} from "./core";

/**
 * Allow adding of a simple key/value pair to a log
 */
export class KV extends AbstractLoggable {
    constructor(private key: string, private value: TJsonValue) {
        super();
    }

    toIJson(): IJson {
        const result: IJson = {};
        result[this.key] = this.value;
        return result;
    }
}

/**
 * Create a version of Error that can be converted to ILoggable
 */
export class LoggableError extends AbstractLoggable {
    constructor(private error: Error) {
        super();
    }

    toIJson(): IJson {
        const content: IJson = {};
        const result: IJson = {};
        result[this.error.name] = content;

        content.type = 'Error';
        content.name = this.error.name;
        content.message = this.error.message;
        content.stack = this.error.stack;

        return result;
    }
}

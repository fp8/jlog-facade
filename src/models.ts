import {
    TJsonValue, IJson,
    AbstractLoggable
} from "./core";

export type TLoggableType = TJsonValue | AbstractLoggable;

/**
 * Allow adding of a simple key/value pair to a log.  When multiple
 * key is detected, the first key logged prevails over subsequent
 * value assigned to the same key
 */
export class KV<T extends TLoggableType> extends AbstractLoggable {
    constructor(public readonly key: string, private value: T) {
        super();
    }

    toIJson(): IJson {
        const result: IJson = {};
        const value = this.value;
        if (value instanceof AbstractLoggable) {
            result[this.key] = value.toIJson();
        } else {
            result[this.key] = value;
        }
        
        return result;
    }
}

/**
 * Allow adding of a key/value pair to a log where resulting value
 * is always a list.  When multiple key is detected, the values
 * are merged.
 */
 export class Label<T extends TLoggableType> extends AbstractLoggable {
    private _values: TLoggableType[];

    constructor(public readonly key: string, ...values: T[]) {
        super();
        this._values = values;
    }

    public get values(): TJsonValue[] {
        return this._values.map(entry => {
            if (entry instanceof AbstractLoggable) {
                return entry.toIJson();
            } else {
                return entry;
            }
        });
    }

    toIJson(): IJson {
        const result: IJson = {};
        result[this.key] = this.values;
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

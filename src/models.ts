import {
    TJsonValue, IJson,
    AbstractLoggable, TLoggableValue,
    convertValueToIJson, mergeIJson
} from "./core";

import {isArray, isObject} from './helper';

function appendToSet<T>(cummulator: Set<T>, input: T | T[]): void {
    if (isArray(input)) {
        input.forEach(entry => cummulator.add(entry));
    } else {
        cummulator.add(input);
    }
}

/**
 * Merge a list of KVs into a IJson, optionally merging the values into an array of values.
 * 
 * If mergeValue is FALSE, the last key in the list prevail
 *
 * @param mergeValue 
 * @param kvs 
 * @returns 
 */
function mergeKV(mergeValue: boolean, kvs: AbstractKeyValue<TLoggableValue>[]): IJson {
    const result: { [key: string]: TJsonValue | TJsonValue[]} = {};
    const merged: { [key: string]: Set<TJsonValue | TJsonValue[]>} = {};

    // Ensure that no dup key exists
    // NB.: as the input comes from result of JLogger.extractData, the entries in the list are already
    // in the reverse order from the caller's perspective.  Must not reverse the order of kvs again here.
    for (const kv of kvs) {
        const key = kv.key;
        const value = kv.value;
        /*
        Merge the value to a Set if mergeValue flag is set.  If flag is set to false,
        the repeated key instance is ignored.
        */
        if (mergeValue === true && key in result) {
            if (!(key in merged)) {
                // Create a set if first time
                merged[key] = new Set<TJsonValue | TJsonValue[]>();
                appendToSet(merged[key], result[key]);
            }

            const converted = convertValueToIJson(value);
            if (isArray(converted)) {
                converted.forEach(
                    convertedEntry => merged[key].add(convertedEntry)
                );
            } else {
                merged[key].add(converted);
            }
        } else {
            result[key] = convertValueToIJson(value);
        }
    }

    // If merged exists, replace result's key with list from merged
    if (Object.keys(merged).length) {
        for (const [key, value] of Object.entries(merged)) {
            result[key] = Array.from(value.values()) as TJsonValue | TJsonValue[];
        }
    }

    return result;
}


/**
 * Merge a list of AbstractLogger into a single IJson.  This method will first break-down the input
 * into 3 different lists:
 * 
 * 1. Create a list of KV from the input of loggables
 * 1. Create a list of IJson from remaining input of loggables
 * 1. Create a list of values where loggables are not an object
 * 
 * It then perform merging by using following steps (note that later entry overwrtes previous ones):
 * 
 * 1. Merge list of IJson to output
 * 1. Merge first the list of KV using mergeKV and then merge the result into output
 * 1. Return data as IJson and values as list of TJsonValue
 * 
 * **Note:** The values is expected to already return empty as those should have been
 * filtered out by `JLogger.extractData` method.
 * 
 * @param loggables 
 * @returns 
 */
export function mergeLoggableModels<T extends TLoggableValue>(...loggables: AbstractLoggable[]): {
    loggableJson: IJson,
    loggableValues: TJsonValue[]
} {
    const json: IJson[] = [];
    const kvs: AbstractKeyValue<T>[] = [];
    const loggableValues: TJsonValue[] = [];

    // Break the input list into different type of container
    for (const loggable of loggables) {
        if (loggable instanceof AbstractKeyValue) {
            kvs.push(loggable);
        } else if (loggable instanceof AbstractLoggable) {
            json.push(loggable.toIJson())
        } else if (isObject(loggable)) {
            json.push(loggable)
        } else {
            loggableValues.push(loggable);
        }
    }

    // Build output data
    const loggableJson: IJson = {};

    const kvJson = mergeKV(false, kvs);
    mergeIJson(loggableJson, ...json, kvJson);

    return {loggableJson, loggableValues};
}

/**
 * Abstract class serving foundation for Key Value loggables
 */
export abstract class AbstractKeyValue<T extends TLoggableValue> extends AbstractLoggable {
    protected _key: string;
    protected _value: T | T[];

    constructor(key: string, value: T) {
        super();
        this._key = key;
        this._value = value;
    }

    public get key(): string {
        return this._key;
    }

    public get value(): T | T[] {
        return this._value;
    }

    /**
     * Convert KV into a JSON
     *
     * @returns 
     */
    toIJson(): IJson {
        return {
            [this.key]: convertValueToIJson(this.value)
        };
    }


}

/**
 * Allow adding of a simple key/value pair to a log.  When multiple
 * key is detected, the first key logged prevails over subsequent
 * value assigned to the same key
 */
export class KV<T extends TLoggableValue> extends AbstractKeyValue<T> {
    protected override _value: T;

    /**
     * Factory method for KV
     *
     * @param key 
     * @param value 
     * @returns 
     */
    public static of<T extends TLoggableValue>(key: string, value: T): KV<T> {
        return new KV(key, value);
    }

    /**
     * Merge list of KVs and skip duplicate key if found later in the list
     *
     * @param kvs 
     * @returns 
     */
    public static merge<T extends TLoggableValue>(...kvs: AbstractKeyValue<T>[]): IJson {
        return mergeKV(false, kvs);
    }

    /**
     * Merge list of KVs if duplicate keys found, convert the value into an array.
     * 
     * **N.B.:** Use this method with caution as downstream system such as logstash
     * does not like when datatype of a key changes.  It could result in the log
     * being missed.
     * 
     * @param kvs 
     * @returns 
     */
    public static mergeValue<T extends TLoggableValue>(...kvs: AbstractKeyValue<T>[]): IJson {
        return mergeKV(true, kvs)
    }

    constructor(key: string, value: T) {
        super(key, value);
        this._key = key;
        this._value = value;
    }

    public get key(): string {
        return this._key;
    }

    public get value(): T | T[] {
        return this._value;
    }

    /**
     * Convert KV into a JSON
     *
     * @returns 
     */
    toIJson(): IJson {
        return {
            [this.key]: convertValueToIJson(this.value)
        };
    }
}

/**
 * A single key value pair where value is always string
 */
export class Label extends AbstractKeyValue<string> {
    override _value: string;

    /**
     * Factory method for Label
     *
     * @param key 
     * @param value 
     * @returns 
     */
    public static of(key: string, value: string): Label {
        return new Label(key, value);
    }

    override get value(): string {
        return this._value;
    }

    constructor(key: string, value: string) {
        super(key, value);
        this._value = value;
    }
}

/**
 * Allow adding of a key/value pair to a log where resulting value
 * is always a list.  When multiple key is detected, the values
 * are merged.
 */
 export class Tags<T extends TLoggableValue> extends AbstractKeyValue<T> {
    override _value: T[];

    /**
     * Factory method for Tags
     *
     * @param key 
     * @param value 
     * @returns 
     */
    public static of<T extends TLoggableValue>(key: string, ...values: T[]): Tags<T> {
        return new Tags(key, ...values);
    }

    override get value(): T[] {
        return this._value;
    }

    constructor(key: string, ...values: T[]) {
        super(key, null as T);
        this._value = values;
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

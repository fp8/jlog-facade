import {
    TJsonValue, IJson,
    AbstractLoggable, TLoggableValue,
    convertValueToIJson, mergeIJson
} from "./core";

import {isEmpty, isObject} from './helper';


/**
 * Merge a list of KVs into a IJson, optionally merging the values into an array of values.
 * 
 * If mergeValue is FALSE, the first key in the list prevail
 *
 * @param mergeValue 
 * @param kvs 
 * @returns 
 */
function mergeKV(mergeValue: boolean, kvs: KV<TLoggableValue>[]): IJson {
    const result: { [key: string]: TJsonValue | TJsonValue[]} = {};
    const merged: { [key: string]: Set<TJsonValue | TJsonValue[]>} = {};

    // Ensure that no dup key exists
    for (const kv of kvs) {
        const key = kv.key;
        const value = kv.value;

        /*
        Merge the value to a Set if mergeValue flag is set.  If flag is set to false,
        the repeated key instance is ignored.
        */
        if (mergeValue === true && key in result) {
            if (key in merged) {
                // Already exists in merged, just add to Set
                merged[key].add(
                    convertValueToIJson(value)
                );
            } else {
                // First time
                merged[key] = new Set<TJsonValue | TJsonValue[]>([
                    convertValueToIJson(value)
                ]);
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
    const kvs: KV<T>[] = [];
    const loggableValues: TJsonValue[] = [];

    // Break the input list into different type of container
    for (const loggable of loggables) {
        if (loggable instanceof KV) {
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
 * Allow adding of a simple key/value pair to a log.  When multiple
 * key is detected, the first key logged prevails over subsequent
 * value assigned to the same key
 */
export class KV<T extends TLoggableValue> extends AbstractLoggable {
    /**
     * Merge list of KVs and skip duplicate key if found later in the list
     *
     * @param kvs 
     * @returns 
     */
    public static merge<T extends TLoggableValue>(...kvs: KV<T>[]): IJson {
        return mergeKV(false, kvs)
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
    public static mergeValue<T extends TLoggableValue>(...kvs: KV<T>[]): IJson {
        return mergeKV(false, kvs)
    }

    constructor(public readonly key: string, public readonly value: T | T[]) {
        super();
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
export class Label extends KV<string> {}

/**
 * Allow adding of a key/value pair to a log where resulting value
 * is always a list.  When multiple key is detected, the values
 * are merged.
 */
 export class Tags<T extends TLoggableValue> extends KV<T> {
    override value: T[];

    constructor(key: string, ...values: T[]) {
        super(key, values);
        this.value = values;
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

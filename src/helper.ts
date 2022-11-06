/**
 * A simple delay function 
 */
 export async function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve, _) => {
        setTimeout(resolve, milliseconds);
    });
}

/**
 * Check if input is null or undefined
 *
 * @param input 
 * @returns 
 */
export function isNullOrUndefined(input: unknown): input is null | undefined {
    return (input === null || input === undefined);
}

/**
 * Check if an input is an array
 *
 * @param input 
 * @returns 
 */
export function isArray(input: unknown): input is Array<unknown> {
    if (isNullOrUndefined(input)) {
        return false;
    }
    return Array.isArray(input);
}

/**
 * 
 * @param input 
 */
export function isObject(input: unknown): input is Record<string, unknown> {
    if (isNullOrUndefined(input)) {
        return false;
    }
    return (typeof input === 'object' && !isArray(input));
}

/**
 * Simple is object empty check
 * 
 * ref: https://stackoverflow.com/a/59787784/2355087
 */
export function isEmpty(input: unknown): boolean  {
    if (isNullOrUndefined(input)) {
        return true;
    }

    if (typeof input === 'string' || isArray(input)) {
        return input.length === 0;
    } else if (input instanceof Date) {
        // Date is an object but has not properties
        return false;
    } else if (isObject(input)) {
        for (const i in input) return false;
        return true;
    } else {
        return false;
    }
}

/**
 * A local error output
 */
 const SHOW_ERROR_MESSAGE = true; // set to false to omit any local errors
 export function localError(message: string, error?: Error): void {
     if (SHOW_ERROR_MESSAGE) {
         console.error(`[E] ${message}`);
         if (error) {
             console.error(error);
         }
     }
 }
 
 /**
  * A local debug output
  */
 export function localDebug(message: string): void {
     if (process.env.DEBUG) {
         console.debug(`[D] ${message}`);
     }
 }
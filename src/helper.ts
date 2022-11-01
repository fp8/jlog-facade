/**
 * A simple delay function 
 */
 export async function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve, _) => {
        setTimeout(resolve, milliseconds);
    });
}

/**
 * Simple is object empty check
 * 
 * ref: https://stackoverflow.com/a/59787784/2355087
 */
export function isEmpty(input: Object | null | undefined): boolean {
    if (input === undefined || input === null) {
        return true;
    }
    for (const i in input) return false;

    // Special processing for Date object
    if (input instanceof Date) {
        return false;
    } else {
        return true;
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
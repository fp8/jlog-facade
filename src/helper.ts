// STAND-ALONE PACKAGE -- Must not import anything from this project
import { createHash } from 'crypto';
/**
 * The string that will replace the circular reference in the JSON.stringify
 */
export const CIRCULAR_STRUCTURE_ERROR = `[ERROR:circular-structure]`;

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
export function isEmpty(input: unknown): boolean {
    if (isNullOrUndefined(input)) {
        return true;
    }

    if (typeof input === 'string' || isArray(input)) {
        return input.length === 0;
    } else if (input instanceof Date) {
        // Date is an object but has not properties
        return false;
    } else if (input instanceof Buffer) {
        return input.length === 0;
    } else if (isObject(input)) {
        for (const i in input) return false;
        return true;
    } else {
        return false;
    }
}

/**
 * Check if an input is not empty with Type Guard
 *
 * @param input 
 * @returns 
 */
export function isNotEmpty<T>(input: unknown): input is T {
    return !isEmpty(input);
}

/**
 * A local error output
 */
const SHOW_ERROR_MESSAGE = true; // set to false to omit any local errors
export function localError(message: string, error?: Error): void {
    if (SHOW_ERROR_MESSAGE) {
        if (error) {
            console.error(`[jlog-facade ERROR] ${message}`, error);
        } else {
            console.error(`[jlog-facade ERROR] ${message}`);
        }
    }
}

/**
 * A local debug output.  Pass a callback as a messaage to safely log debug message.
 * 
 * If debug `name` is passed, the debug will only write if:
 * 
 * 1. name starts with string set in DEBUG environmental variable
 * 2. DEBUG is set to `*`
 * 3. DEBUG is set to `local`
 *
 */
export function localDebug(input: string | (() => string), name?: string): void {
    if (process.env.DEBUG) {
        // If debug name is passed, check that it matches
        if (name !== undefined) {
            let toDebug = false;
            if (process.env.DEBUG === '*' || process.env.DEBUG === 'local') {
                toDebug = true;
            } else if (name.startsWith(process.env.DEBUG)) {
                toDebug = true;
            }
            if (!toDebug) {
                return;
            }
        }

        let message: string | undefined = undefined;
        if (typeof input === 'string') {
            message = input;
        } else {
            try {
                message = input();
            } catch (e) {
                console.error(`[D ERROR] ${e}.  Failed to create log`);
            }
        }

        if (message) {
            console.debug(`[D] ${message}`);
        }
    }
}

/**
 * A function to be used by JSON.stringify to replace circular references to null
 * 
 * ref: https://stackoverflow.com/a/69881039/2355087
 */
export function circularReferenceReplacer(): (key: string, value: unknown) => unknown {
    const visited = new WeakSet();
    return (key: string, value: unknown) => {
      if (typeof value === "object" && value !== null) {
        if (visited.has(value)) {
          return CIRCULAR_STRUCTURE_ERROR;
        }
        visited.add(value);
      }
      return value;
    };
}


/**
 * A replacement for JSON.stringify that attempts to call JSON.stringify and if it fails,
 * it will attempt to remove circular references
 */
export function safeStringify(input: unknown): string {
    try {
        return JSON.stringify(input);
    } catch (error) {
        localDebug(() => `safeStringify: JSON.stringify error: ${error} will attempt to remove circular structure and replace with it with "${CIRCULAR_STRUCTURE_ERROR}" string`);
        return JSON.stringify(input, circularReferenceReplacer());
    }
}

/**
 * Masks a secret string or buffer by either hashing it or partially revealing it.
 * 
 * This function ensures that sensitive information is not fully exposed in logs or other outputs.
 * If the secret is too short (less or equal than 12 characters) or if forced, it will be hashed and a portion of the hash will be used.
 * Otherwise, it will reveal the first and last few characters of the secret, masking the middle part.
 * 
 * @param secret - The secret string or buffer to be masked.
 * @param forceHash - Optional flag to force hashing of the secret regardless of its length. Defaults to false.
 * @returns A masked version of the secret, either partially revealed or hashed.
 */
export function maskSecret(secret: string | Buffer, forceHash = false): string {
    const leading = 4;
    const trailing = 4;
    // Minimum length of secret before being hashed
    const minSecretLength = leading + trailing + 4;
  
    // Make sure that secret to be logged is always a string
    let secretToUse: string;
  
    // If length of secret is less or equal to 12, use a hashed version of the secret
    if (secret.length <= minSecretLength || forceHash) {
      const hash = createHash('sha256').update(secret).digest();
  
      const buf = Buffer.alloc(15);
      hash.copy(buf, 0, 0, 15);
      secretToUse = buf.toString('base64');
    } else {
      if (secret instanceof Buffer) {
        secretToUse = secret.toString('base64');
      } else {
        secretToUse = secret;
      }
    }
  
    // Create output
    return `${secretToUse.slice(0, leading)}...${secretToUse.slice(-trailing)}`;
  }
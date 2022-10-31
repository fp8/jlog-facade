/**
 * Test if variable passed is NULL
 *
 * @param value to be tested
 */
export function IsNull(value: string|number|null|undefined): value is null {
    return Boolean(value === null);
}

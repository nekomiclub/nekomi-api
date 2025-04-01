/** Parse object types from pseudo ("123", "false") to real
 * "false" > boolean
 * "123" > number
 * "null" > null
 * "undefined" > undefined
 */
export function parseObjectTypes<T = any>(object: object): T {
  const result = { ...object } as T;

  for (const key in object) {
    const value = object[key];

    if (value === 'true') result[key] = true;
    else if (value === 'false') result[key] = false;
    else if (value === 'null') result[key] = null;
    else if (value === 'undefined') result[key] = undefined;
    else if (!isNaN(+value)) result[key] = +value;
  }

  return result;
}

export default parseObjectTypes;
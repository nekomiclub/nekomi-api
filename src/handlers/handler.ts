import * as uuid from 'uuid';
import ip from 'ip';
import { convert as convertSlug } from 'url-slug';



/** Return current IPv4 if raw match 0.0.0.0 */
export function preserveIP(raw: string): string {
  if (raw === '0.0.0.0') {
    return ip.address();
  } else {
    return raw;
  }
}

/** @deprecated this version is outdated */
export function createUUID(): string {
  return uuid.v4();
}

/** @deprecated this version is outdated */
export function createSlug(input: string) {
  return convertSlug(input, {
    camelCase: true,
    separator: '-'
  });
}

/** @deprecated this version is outdated */
export function trimString(input: string) {
  return input.trim().replace(/\s+/g, ' ');
}

/** Get ID with specified length
 * @deprecated use createID
 */
export function createStringID(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  let result = '';
  let counter = 0;

  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }

  return result;
}

export function getRandomNumberInRange(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max + 1 - min));
}

/** Get UTC date
 * @param timestamp Timestamp to start from. Default - now
 */
export function getUTC(timestamp?: number | null): {
  year: number
  /** January is first month, december is 12 */
  month: number
  date: number
  weekDay: number
  hrs: number
  mins: number
  secs: number
  ms: number
  timestamp: number
  /** Time
   * @returns 'hh:mm'
   */
  time: string
  /** Accurate time
   * @returns 'hh:mm:ss.mss'
   */
  timeAccurate: string
  /** European fulldate
   * @returns 'dd.mm.yyyy'
   */
  fulldate: string
} {
  const now = timestamp ? new Date(timestamp) : new Date();

  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const date = String(now.getUTCDate()).padStart(2, '0');
  const weekDay = now.getUTCDay();
  const hrs = String(now.getUTCHours()).padStart(2, '0');
  const mins = String(now.getUTCMinutes()).padStart(2, '0');
  const secs = String(now.getUTCSeconds()).padStart(2, '0');
  const ms = String(now.getUTCMilliseconds()).padStart(4, '0');

  return {
    year,
    month: +month,
    date: +date,
    weekDay,
    hrs: +hrs,
    mins: +mins,
    secs: +secs,
    ms: +ms,
    timestamp: now.getTime(),
    fulldate: `${date}.${month}.${year}`,
    time: `${hrs}:${mins}`,
    timeAccurate: `${hrs}:${mins}:${secs}.${ms}`,
  };
}

/** Parse WEK, MON MM, YYYY */
export function parseIMDBDate(dateString: string): number {
  const months = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const dateParts = dateString.split(' ');

  const day = parseInt(dateParts[2]);
  const month = months[dateParts[1]];
  const year = parseInt(dateParts[3]);


  return +new Date(year, month, day);
}



/** Return part of elements by it's page and limit */
export function arrayPagination({ elements, limit, page }: { elements: any[], page: number, limit: number }) {
  return elements.slice(page * limit, (page + 1) * limit);
}

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
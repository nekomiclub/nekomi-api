import crypto from 'crypto';



/** 
 * Get UTC date
 * 
 * @param ts ISO/UTC string, timestamp or Date
 */
export function getUTC(ts?: string | number | Date) {
  const now = new Date(ts ?? new Date());

  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth()).padStart(2, '0');
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
    time: `${hrs}:${mins}:${secs}`,

    /** Stringified values (with pads) */
    str: { month, hrs, mins, secs, ms },

    ISO: now.toISOString(),
  };
}



/** 
 * Trim string and remove all excess spaces
 * 
 * @example "   Hello  World  " > "Hello World"
 */
export function trimString(input: string) {
  return input.trim().replace(/\s+/g, ' ');
}



/** Get random number between min and max */
export function randomBetween(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max + 1 - min));
}



export function buffer2hash(data: Buffer) {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}
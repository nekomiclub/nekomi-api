import crypto from 'crypto';
import { ISODateString } from '~/intf/types';



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
 * Calculate ISO string with arguments
 */
export function calcISO(ISO: ISODateString, ...args: number[]): number {
  const ts = getUTC(ISO).timestamp;
  const offset = args.reduce((sum, ms) => sum + ms, 0);

  return ts + offset;
}



/** 
 * Get time diff between startedAt and now in msec
 * 
 * @returns `{startedAt - now}ms`
 */
export function endWithin(startedAt: number): string {
  return `${getUTC().timestamp - startedAt}ms`;
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







export function removeMarkdown(text: string): string {
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove images
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    // Remove headings
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold & italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove strikethrough
    .replace(/~~(.*?)~~/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '')
    // Remove unordered/ordered list markers
    .replace(/^(\s*[-+*]|\s*\d+\.)\s+/gm, '')
    // Remove extra newlines
    .replace(/\n{2,}/g, '\n')
    .trim();
}
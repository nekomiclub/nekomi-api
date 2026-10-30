import crypto from 'crypto';
import { ISODateString, asISODateString } from '~/intf/BrandedIds';



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

    ISO: asISODateString(now.toISOString()),
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



/** Exclude second array of values from first array */
export function excludeValuesFromArray(a: any[], b: any[]): any[] {
  const exclude = new Set(b);

  return a.filter(el => !exclude.has(el));
}



/** If number is not retrieved, will return -1 */
export function retrieveNumberFromString(text: string): number | null {
  const match = text.match(/\d+/gi);

  return match ? Number(match[0]) : null;
}



/** Await specified time span */
export async function sleep(ms: number) {
  await new Promise(res => {
    setTimeout(() => {
      res(1);
    }, ms);
  });
}



/** Extract anime content season and content part from title */
export function extractAnimeContentSeason(title: string): number {
  const normalized = title.toLowerCase();

  // =====================
  // SEASON MATCHING
  // =====================
  let season = 1;

  // 1. "season 2", "season: 02", "season-2"
  let match = normalized.match(/season\s*[:-]?\s*(\d{1,2})/);
  if (match) season = parseInt(match[1], 10);

  // 2. "2nd season", "3rd season"
  match = normalized.match(/(\d{1,2})(st|nd|rd|th)?\s+season/);
  if (match) season = parseInt(match[1], 10);

  // 3. "s2", "s02"
  match = normalized.match(/\bs(\d{1,2})\b/);
  if (match) season = parseInt(match[1], 10);

  // 4. Word-based seasons
  const wordToNumber: Record<string, number> = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
    sixth: 6,
    seventh: 7,
    eighth: 8,
    ninth: 9,
    tenth: 10
  };

  match = normalized.match(
    new RegExp(`(${Object.keys(wordToNumber).join('|')})\\s+season`)
  );

  if (match) season = wordToNumber[match[1]];

  // =====================
  // ANIME PART / COUR MATCHING
  // =====================
  let part = 1;

  // 5. "part 2", "part: 02", "final part 3"
  match = normalized.match(/part\s*[:-]?\s*(\d{1,2})/);
  if (match) part = parseInt(match[1], 10);

  // 6. "cour 1", "split cour 2"
  match = normalized.match(/cour\s*[:-]?\s*(\d{1,2})/);
  if (match) part = parseInt(match[1], 10);

  // 7. Roman numerals: "part ii", "part iv"
  const romanMap: Record<string, number> = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6
  };

  match = normalized.match(/part\s+(i{1,3}|iv|v|vi)\b/);
  if (match) part = romanMap[match[1]] ?? null;

  return +`${season}.${part}`;
}



export function getObjectKeyByValue<
  T extends Record<string, string | number>
>(obj: T, value: string | number): keyof T | null {
  return (Object.keys(obj) as (keyof T)[]).find(
    key => obj[key] === value
  ) ?? null;
}
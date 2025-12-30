import crypto from 'crypto';
import z, { ZodError } from 'zod';
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



const EnvSchema = z.object({
  PORT: z.coerce.number(),
  HOST: z.string(),

  ENV: z.enum(['local', 'deploy']),
  DOCKER: z.coerce.boolean().optional(),
  VITEST: z.coerce.boolean().optional(),

  DATABASE_HOST: z.string(),
  DATABASE_NAME: z.string(),
  DATABASE_USR: z.string(),
  DATABASE_PWD: z.string(),

  CSRF_SK: z.string(),
  MAL_CLIENT_SK: z.string(),
  ASHDI_API_SK: z.string(),
  IDS_MOE_SK: z.string(),
  USER_SESSION_SK: z.string(),

  NEKOMI_API_URL: z.string().url(),
  NEKOMI_NEXTJS_URL: z.string().url(),
  NEKOMI_UPLOAD_SERVICE_URL: z.string().url(),
});

export function parseEnv(): z.infer<typeof EnvSchema> {
  try {
    return EnvSchema.parse(process.env);
  } catch (e) {
    if (e instanceof ZodError) {
      console.error(`


-----------------------------------------

ENVIRONMENT ERROR: ${JSON.stringify(e.errors, null, 2)}

-----------------------------------------

  
        `);

      throw '';
    } else throw e;
  }
}
/** @fileoverview Node.js env parser */

import { config as dotenvCfg } from 'dotenv';

dotenvCfg({ quiet: true });

import z, { ZodError } from 'zod';
import { zBoolean } from '~/interfaces/types.js';



/** Environment config schema */
export const EnvConfigSchema = z.object({
  PORT: z.coerce.number(),
  HOST: z.string(),

  ENV: z.enum(['local', 'deploy']).describe('Local env meaning this is development instance of the App. In local env some runtime processes will not run (CRON, database migrations). In deploy mode runtime functions will be invoked'),

  GIT_SHA: z.string().optional().describe('Optional git commit hash. Provided by publish workflow when release builds'),
  APP_VERSION: z.string().optional().describe('Optional git tag. Provided by publish workflow when release builds'),

  DOCKER: zBoolean.optional().describe('Whether is app runs in docker'),
  VITEST: zBoolean.optional().describe('Whether is app runs by vitest'),

  DATABASE_HOST: z.string(),
  DATABASE_NAME: z.string(),
  DATABASE_USR: z.string(),
  DATABASE_PWD: z.string(),

  API_KEY_SK: z.string().describe('General API key for client-server messaging'),
  USER_SESSION_SK: z.string().describe('Any secure string key to hash user session token JWTs'),

  ASHDI_API_SK: z.string().optional(),
  MOONANIME_API_SK: z.string().optional(),
  IDS_MOE_SK: z.string().optional(),

  NEKOMI_NEXTJS_URL: z.string().url(),
  NEKOMI_UPLOAD_SERVICE_URL: z.string().url(),
});

export type TEnvConfigSchema = z.infer<typeof EnvConfigSchema>



/** Get enviromental variable function */
function env<K extends keyof TEnvConfigSchema>(key: K): TEnvConfigSchema[K] {
  try {
    return EnvConfigSchema.parse(process.env)[key];
  } catch (e) {
    if (e instanceof ZodError) {
      throw new Error(`[Env]: Env parse is invalid. Errors: ${JSON.stringify(e.errors, null, 2)}`);
    } else throw e;
  }
}



export default env;
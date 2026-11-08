/** @fileoverview Node.js env parser */

import { config as dotenvCfg } from 'dotenv';

dotenvCfg({ quiet: true });

import z, { ZodError } from 'zod';
import { zBoolean } from '~/interfaces/types.js';



/** Environment config schema */
export const EnvConfigSchema = z.object({
  PORT: z.coerce.number(),
  HOST: z.string(),

  ENV: z.enum(['local', 'deploy']),

  GIT_SHA: z.string().optional(),
  APP_VERSION: z.string().optional(),

  DOCKER: zBoolean.optional(),
  VITEST: zBoolean.optional(),

  DATABASE_HOST: z.string(),
  DATABASE_NAME: z.string(),
  DATABASE_USR: z.string(),
  DATABASE_PWD: z.string(),

  API_KEY_SK: z.string(),

  MAL_CLIENT_SK: z.string(),
  ASHDI_API_SK: z.string(),
  MOONANIME_API_SK: z.string(),
  IDS_MOE_SK: z.string(),
  USER_SESSION_SK: z.string(),

  NEKOMI_NEXTJS_URL: z.string().url(),
  NEKOMI_UPLOAD_SERVICE_URL: z.string().url(),
  ASHDI_API_URL: z.string().url(),
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
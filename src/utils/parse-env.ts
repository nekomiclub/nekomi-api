import z, { ZodError } from 'zod';
import { zBoolean } from '~/interfaces/types.js';



const EnvSchema = z.object({
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

  NEKOMI_API_URL: z.string().url(),
  NEKOMI_NEXTJS_URL: z.string().url(),
  NEKOMI_UPLOAD_SERVICE_URL: z.string().url(),
  ASHDI_API_URL: z.string().url(),
});



function parseEnv(): z.infer<typeof EnvSchema> {
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



export default parseEnv;
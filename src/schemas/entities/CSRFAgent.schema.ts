import { asISODateString } from '~/intf/BrandedIds';
import { z } from 'zod';

/* --------------------- */
/* Schema                */
/* --------------------- */

export const CSRFAgentSchema = z.object({
  id: z.string(),
  origin: z.string(),
  public_key: z.string(),
  created_at: z.string().transform(asISODateString),
});

/* --------------------- */
/* Inferred type         */
/* --------------------- */

export type ICSRFAgent = z.infer<typeof CSRFAgentSchema>



export default ICSRFAgent;
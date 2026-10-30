import z from 'zod';
import { asUserId, asUserSessionId } from '~/intf/BrandedIds';



export enum AUTH_METHOD {
  GOOGLE = 'provider:google'
}



export const SessionTokenSchema = z.object({
  token_id: z.string().nonempty(),
  user_id: z.string().nonempty().transform(asUserId),
  session_id: z.string().nonempty().transform(asUserSessionId),
});

export const CSRFTokenSchema = z.object({
  token_id: z.string().nonempty(),
  origin: z.string().nonempty(),
});



export type SessionTokenType = z.infer<typeof SessionTokenSchema>
export type CSRFTokenType = z.infer<typeof CSRFTokenSchema>
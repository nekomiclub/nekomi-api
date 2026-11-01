import z from 'zod';
import { asUserId, asUserSessionId } from '~/intf/BrandedIds';
import { registry } from '~/service/openapi/registry';



export enum AUTH_METHOD {
  GOOGLE = 'provider:google'
}

registry.register('AUTH_METHOD_ENUM', z.nativeEnum(AUTH_METHOD));



export const SessionTokenSchema = z.object({
  token_id: z.string().nonempty(),
  user_id: z.string().nonempty().transform(asUserId),
  session_id: z.string().nonempty().transform(asUserSessionId),
});



export type SessionTokenType = z.infer<typeof SessionTokenSchema>
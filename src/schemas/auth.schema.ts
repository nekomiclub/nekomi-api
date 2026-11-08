import z from 'zod';
import { registry } from '~/services/openapi/registry.js';



export enum AUTH_METHOD {
  GOOGLE = 'provider:google'
}

registry.register('AUTH_METHOD_ENUM', z.nativeEnum(AUTH_METHOD));



export const SessionTokenSchema = z.object({
  token_id: z.string().nonempty(),
  user_id: z.string().nonempty(),
  session_id: z.string().nonempty(),
});



export type SessionTokenType = z.infer<typeof SessionTokenSchema>
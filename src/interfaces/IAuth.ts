import z from 'zod';



export enum AUTH_METHOD {
  GOOGLE = 'provider:google'
}



export const SessionTokenSchema = z.object({
  token_id: z.string().nonempty(),
  user_id: z.string().nonempty(),
  session_id: z.string().nonempty(),
});

export const CSRFTokenSchema = z.object({
  token_id: z.string().nonempty(),
  origin: z.string().nonempty(),
});



export type SessionTokenType = z.infer<typeof SessionTokenSchema>
export type CSRFTokenType = z.infer<typeof CSRFTokenSchema>




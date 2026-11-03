import z from 'zod';

/* --------------------- */
/* Native enum           */
/* --------------------- */

export enum ROLE_PERMISSION_ENUM {
  ABSOLUTE = 'sys:absolute',
  BASIC = 'sys:basic',
}

/* --------------------- */
/* Schema                */
/* --------------------- */

export const RoleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  permissions: z.nativeEnum(ROLE_PERMISSION_ENUM).openapi('ROLE_PERMISSION_ENUM').array(),
}).openapi('Role');

/* --------------------- */
/* Inferred type         */
/* --------------------- */

export type IRole = z.infer<typeof RoleSchema>



export default IRole;
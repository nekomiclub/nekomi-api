import z from 'zod';
import { asRoleId } from '~/intf/BrandedIds';

/* --------------------- */
/* Native enum           */
/* --------------------- */

export enum ROLE_PERMISSION {
  ABSOLUTE = 'sys:absolute',
  BASIC = 'sys:basic',
}

/* --------------------- */
/* Schema                */
/* --------------------- */

export const RoleSchema = z.object({
  id: z.string().transform(asRoleId),
  slug: z.string(),
  name: z.string(),
  permissions: z.nativeEnum(ROLE_PERMISSION).array(),
}).openapi('Role');

/* --------------------- */
/* Inferred type         */
/* --------------------- */

export type IRole = z.infer<typeof RoleSchema>



export default IRole;
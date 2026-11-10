import z from 'zod';

/* --------------------- */
/* Enums                 */
/* --------------------- */

export const ROLE_PERMISSION_ENUM = z.enum({
  ABSOLUTE: 'sys:absolute',
  BASIC: 'sys:basic',
}).openapi('ROLE_PERMISSION_ENUM');

/* --------------------- */
/* Base schema           */
/* --------------------- */

export const RoleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  permissions: ROLE_PERMISSION_ENUM.array(),
}).openapi('Role');

/* --------------------- */
/* Repository schemas    */
/* --------------------- */

export const CreateRoleSchema = RoleSchema.pick({
  name: true
});

/* --------------------- */
/* Inferred types        */
/* --------------------- */

export type ROLE_PERMISSION_ENUM = z.infer<typeof ROLE_PERMISSION_ENUM>

export type RoleEntity = z.infer<typeof RoleSchema>

export type ICreateRoleEntity = z.infer<typeof CreateRoleSchema>



export default RoleEntity;
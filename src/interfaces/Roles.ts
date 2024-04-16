/** Role object */
export interface IRole {
  /** Role id */
  id: string

  /** Role code */
  code: string

  /** Role title */
  title: string

  /** Capabilities */
  capabilities: TRoleCapability[]
}

/** Array of roles capabilities
 * @see docs/roles.md
 */
export const RoleCapabilities = [
  'root',
  'admin',
  'mod',
  'editor',
  'dubber',
  'basic',
  'titleAdd',
  'titleEdit',
  'titleDelete',
  'titleEditEpsMeta',
  'titleEditLinked',
  'seriesAdd',
  'seriesDelete',
  'dubberEditMembers',
  'dubberEditEditors',
  'dubberEditProfile',
  'staffEditUserInfo',
  'staffDeleteUser',
  'staffRestrictUser',
  'staffEditDubbers',
  'staffCreateDubber',
  'staffDeleteDubber'
] as const;

/** Type implementation of RoleCapabilities array
 * @see docs/roles.md
 */
export type TRoleCapability = typeof RoleCapabilities[number];
/** Role object */
export interface Role {
  id: string
  code: string
  title: string
  capabilities: RoleCapability[]
}

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

export type RoleCapability = typeof RoleCapabilities[number];



/** @deprecated use Role instead */
export type IRole = Role;
export default Role;

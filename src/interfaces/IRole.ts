/** Role object */
export interface IRole {
  id: string
  code: string
  title: string
  capabilities: RoleCapabilityType[]
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

export type RoleCapabilityType = typeof RoleCapabilities[number];



export default IRole;

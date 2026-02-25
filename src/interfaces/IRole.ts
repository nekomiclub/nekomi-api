import { BrandedId, asBrandedId } from './types';



export type RoleId = BrandedId<string, 'roleId'>;



export enum ROLE_PERMISSION {
  ABSOLUTE = 'sys:absolute',
  BASIC = 'sys:basic',
}



export interface IRole {
  id: RoleId
  slug: string
  name: string
  permissions: ROLE_PERMISSION[]
}



export const asRoleId = (asBrandedId<RoleId>);

export default IRole;
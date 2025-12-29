export enum ROLE_PERMISSION {
  ABSOLUTE = 'sys:absolute',
  BASIC = 'sys:basic',
}



export interface IRole {
  id: string
  slug: string
  name: string
  permissions: ROLE_PERMISSION[]
}



export default IRole;

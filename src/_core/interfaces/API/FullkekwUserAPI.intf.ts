import { TRoleCapability } from '~/core/interfaces/Role.intf';



export interface FullkekwUserAPI_GetUser {
  user: {
    id: string
    username: string
    email: string
    avatarURL: string
  }
}

export interface FullkekwUserAPI_Verify {
  id: string
  capabilities: TRoleCapability[]
  username: string
  avatar: string
}

export interface FullkekwUserAPI_TokenData {
  id: string
  username: string
  avatar: string
}
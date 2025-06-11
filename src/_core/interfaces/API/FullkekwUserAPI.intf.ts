import { RoleCapability } from '~/core/interfaces/Role.intf';



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
  capabilities: RoleCapability[]
  username: string
  avatar: string
}

export interface FullkekwUserAPI_TokenData {
  id: string
  username: string
  avatar: string
}

export interface FullkekwUserAPI_Session {
  userId: string
  sessionId: string
  timestamp: number
}
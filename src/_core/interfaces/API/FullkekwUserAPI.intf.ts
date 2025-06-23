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

export interface FullkekwUserAPI_RefreshPayload {
  id: string
  username: string
  avatar: string
}

export interface FullkekwUserAPI_SessionTokenPayload {
  userId: string
  sessionId: string
  timestamp: number
}
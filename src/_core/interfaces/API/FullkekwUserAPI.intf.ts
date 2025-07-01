import { RoleCapability } from '~/core/interfaces/Role.intf';



export interface FullkekwUser_GetUser {
  user: {
    id: string
    username: string
    email: string
    avatarURL: string
  }
}

export interface FullkekwUser_Verify {
  id: string
  capabilities: RoleCapability[]
  username: string
  avatar: string
}

export interface FullkekwUser_RefreshPayload {
  id: string
  username: string
  avatar: string
}

export interface FullkekwUser_SessionTokenPayload {
  userId: string
  sessionId: string
  timestamp: number
}
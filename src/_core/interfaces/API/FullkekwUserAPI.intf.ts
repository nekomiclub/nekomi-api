//! --------------
//! VERSION: 2.1.0
//! --------------



export interface FullkekwUserAPI_GetUser {
  user: {
    id: string
    username: string
    email: string
    avatarURL: string
  }
}

export interface FullkekwUserAPI_TokenData {
  id: string
  username: string
  avatar: string
}
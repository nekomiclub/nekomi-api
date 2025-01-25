//! --------------
//! VERSION: 2.0.0
//! --------------



export interface IFullkekwUserAPI_GetUser {
  user: {
    id: string
    username: string
    email: string
    avatarURL: string
  }
}

export interface IFullkekwUserAPI_TokenData {
  id: string
  username: string
  avatar: string
}
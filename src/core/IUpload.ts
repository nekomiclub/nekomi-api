export type TUpload = 'photo/user/avatar' | 'photo/series' | 'video/series'

export interface IUploadRequest {
  type: TUpload,
}

export interface IUploadResponse {
  id: string
}
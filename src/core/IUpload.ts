export type TUpload = 'photo/user/avatar' | 'photo/series' | 'video/series'

export interface IUploadRequest {
  type: TUpload,
  ext: 'png' | 'jpg' | 'mp4',
  file: {
    type: 'Buffer',
    data: ArrayBuffer
  }
}

export interface IUploadResponse {
  id: string
}
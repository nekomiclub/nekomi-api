//! --------------
//! VERSION: 1.3.2
//! --------------



/** Episode processing qualities */
export const EpisodeQualities = [240, 480, 720, 1080, 2160] as const;
export type AnimeEpisodeQualityType = typeof EpisodeQualities[number];

export type NekomiUploadType =
  'photo/user/avatar'
  | 'photo/user/banner'
  | 'photo/title/poster'
  | 'photo/raw'
  | 'video/title/episode'

export interface NekomiUploadsAPI_UploadFile {
  id: string
  url: string
  srt_id?: string

  /** @type video/title/episode - total frames count */
  frames?: number
}
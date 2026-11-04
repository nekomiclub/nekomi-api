import { ISODateString } from '~/intf/BrandedIds.js';



/** @version 3.0 */
export interface IMoonanime3Episode {
  episode: number
  videos: IMoonanime3Video[]
}

/** @version 3.0 */
export interface IMoonanime3Video {
  studio: string
  video_url: string
  poster: string
  date: ISODateString
  subtitles: boolean
}
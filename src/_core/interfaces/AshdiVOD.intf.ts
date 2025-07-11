import { AnimeEpisode } from './Anime.intf';



export interface IAshdiVOD {
  imdbId: string // Primary ID
  malIds: number[]
  nekomiIds: string[]
  createdAt: number
  updatedAt: number

  seasons: IAshdiVODSeason[]
}

export interface IAshdiVODSeason {
  season: number
  episodes: AnimeEpisode[]

  malId: number | null
  nekomiId: string | null
}



export enum ASHDI_DUBBERS_MAP {
  'Amanogawa' = 'amanogawa',
}
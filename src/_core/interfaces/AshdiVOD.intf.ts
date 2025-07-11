import { AnimeEpisode } from './Anime.intf';



export interface IAshdiVOD {
  imdbId: string // Primary ID
  malIds: number[]
  createdAt: number
  updatedAt: number

  seasons: IAshdiVODSeason[]
}

export interface IAshdiVODSeason {
  season: number
  episodes: AnimeEpisode[]
  parts: IAshdiVODSeasonPart[]
}

export interface IAshdiVODSeasonPart {
  malId: number
  episodesCount: number
  part: number
}



export enum ASHDI_DUBBERS_MAP {
  'Amanogawa' = 'd979d465-1407-452f-8955-a7692480f9ac',
}
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
  'Справжня Козацька Озвучка' = '__did',
  'Dzuski' = '__did',
  // 'InariOkami' = '__did',
  'UFDUB' = '__did',
  // 'субтитри | AniKappa' = '__did',
  'Студія Качур' = '__did',
  'Шалене Чаювання' = '__did',
  // 'AniUnion' = '__did',
  // 'Дядько Ґрей' = '__did',
  // 'Fusion Dub' = '__did',
  // '10GU' = '__did',
  'Espada Studio' = '__did',
  'Кіото' = '__did',
  'VRDub' = '__did',
  // 'SunDragon Studio' = '__did',
  // 'Субтитри | Netflix' = '__did',
  // 'Wakamania' = '__did',
  // 'CloverDUB' = '__did',
  // 'Субтитри Legat' = '__did',

  'Glass Moon' = '__did',
  'Gwean & Maslinka' = '__did',

  'Starfall' = '__did',
  'Субтитри Starfall' = '__did',

  'Didko Studio' = '__did',
  'Кіото+Didko' = '__did',

  'Клан Кайзоку' = '__did',
  'Clan Kaizoku' = '__did',

  'Робота Голосом' = '__did',
  // 'субтитри | Робота Голосом' = '__did',

  'FanVoxUA' = '__did',
  'FanWoxUA' = '__did',
}
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
  'Справжня Козацька Озвучка' = 'c0bafd73-0a38-46f8-a5ef-b8e6aa150020',
  'Dzuski' = 'd92b0be9-5068-472a-b4b7-f0c77b3c7c3c',
  // 'InariOkami' = '__did',
  'UFDUB' = '__did',
  // 'субтитри | AniKappa' = '__did',
  'Студія Качур' = 'bc08931d-a8d4-4bcb-9c82-3def865872d9',
  // 'Шалене Чаювання' = '__did',
  // 'AniUnion' = '__did',
  // 'Дядько Ґрей' = '__did',
  // 'Fusion Dub' = '__did',
  // '10GU' = '__did',
  'Кіото' = '6f194501-fbb5-423c-a065-e8774a7486ce',
  // 'SunDragon Studio' = '__did',
  // 'Субтитри | Netflix' = '__did',
  // 'Wakamania' = '__did',
  // 'CloverDUB' = '__did',
  // 'Субтитри Legat' = '__did',
  // 'Togarashi' = '__did',
  // 'Юіґень' = '__did',
  // 'EndiffSub' = '__did',
  // 'Bamboo Anime' = '__did',
  // 'CrashDub' = '__did',
  // 'MelodicVoiceStudio' = '__did',
  'InariDuB' = '075fb2d0-73f3-4738-953b-59fd0484412c',
  // 'У куточку в таверні' = '__did',
  // 'UTure Studio' = '__did',
  // 'THE VOP' = '__did',
  'Сокира' = '8236263b-f434-4081-87cd-a5b8692b25dc',
  // 'Flame Studio' = '__did',
  // 'SkiDub' = '__did',
  // 'ARN' = '__did',
  // 'AniUA' = '__did',
  // 'FukuroNachi' = '__did',
  // 'AniCoin' = '__did',
  // 'Субтитри Shogun' = '__did',
  // 'Субтитри Spiral Team' = '__did',
  // 'CrystalVoicesUA' = '__did',
  'Unimay' = '2e259095-9b18-4032-9484-f968dc559025',
  'HATOSHI' = '8257785e-372b-4aed-b19b-49bfc4808340',
  // 'AID Sub Studio' = '__did',
  // 'kafori' = '__did',
  // 'Субтитри Liudysko Studio' = '__did',
  'Lifecycle' = 'fd9439bb-8cf9-4fbd-b7df-e9e20b64327e',
  // 'BambooUA' = '__did',
  // 'UTure Studio' = '__did',
  // 'Тю_Ta3aSho_Studio' = '__did',
  // 'Міцурукі' = '__did',

  'VRDub' = 'f9dfcc69-0028-4934-b0d7-50ab6ab2f841',
  'VRdub' = 'f9dfcc69-0028-4934-b0d7-50ab6ab2f841',

  'Espada Studio' = '3903c614-3f66-4c46-b4af-27e0ee6e137e',
  'Espada studio' = '3903c614-3f66-4c46-b4af-27e0ee6e137e',

  // 'Anime Classic' = '__did',
  // 'Субтитри Anime Classic' = '__did',

  'Glass Moon' = '93476a61-c38f-41b2-8f75-19eaef8a047c',
  'Gwean & Maslinka' = '93476a61-c38f-41b2-8f75-19eaef8a047c',

  'Starfall' = '6ebb85ce-b000-4b2f-b3d4-8afdbfe12944',
  // 'Субтитри Starfall' = '__did',

  'Didko Studio' = 'fd203550-19cc-4fd0-af4c-10050104a4d6',
  'Кіото+Didko' = 'fd203550-19cc-4fd0-af4c-10050104a4d6',

  'Клан Кайзоку' = '881f2bd1-429d-4f69-9159-2087f42a485b',
  'Clan Kaizoku' = '881f2bd1-429d-4f69-9159-2087f42a485b',

  'Робота Голосом' = '057fe719-50ff-46cb-b0d4-dd052c0cd563',
  // 'субтитри | Робота Голосом' = '__did',

  'FanVoxUA' = '4b792d83-e650-4fe8-a9fc-d9a283dfb6af',
  'FanWoxUA' = '4b792d83-e650-4fe8-a9fc-d9a283dfb6af',
}
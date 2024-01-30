import { TAuthProviders } from './IAuth';
import { ITitleEpisodeMeta, ITitleEpisodesDub } from './ITitle';
import { IUserList, IUserSettings, IUserStats, TUserRoles } from './IUser';

export type TAnimeGenres = 'chinese' | '3D' | 'shonen' | 'shounenAi' | 'seinen' | 'shoujoAi' | 'shoujo' | 'comedy' | 'romance' | 'school' | 'martial arts' | 'vampires' | 'military' | 'harem' | 'demons' | 'detective' | 'drama' | 'games' | 'historical' | 'isekai' | 'magic' | 'mecha' | 'music' | 'parody' | 'sliceOfLife' | 'adventure' | 'psychological' | 'samurai' | 'supernatural' | 'sports' | 'superpower' | 'horror' | 'sciFi' | 'fantasy' | 'action' | 'ecchi' | 'thriller' | 'erotica' | 'gourmet';
export type TAnimeAgeRatings = 'G' | 'PG' | 'PG-13' | 'R-17' | 'R+' // G - All; Ages PG - Children; PG-13 - Teens 13 or older; R17 - 17+ (violence & profanity) R+ - Mild Nudity;

export interface ITitle {
  id: string,
  names: {
    eng: string,
    ukr: string,
    alt: string[] | null
  },
  code: string,
  poster: string,
  background: string,
  rating: number | null,
  description: string,
  status: 'announcement' | 'ongoing' | 'out' | 'delayed',
  estimatedEps: number,
  genres: TAnimeGenres[],
  ageRate: TAnimeAgeRatings,
  season: 'summer' | 'autumn' | 'winter' | 'spring',
  type: 'serial' | 'ONA' | 'OVA' | 'film' | 'special',
  year: number,
  studios: string[],
  country: string,
  started: number | null,
  ended: number | null,
  dubs: ITitleEpisodesDub[] | null,
  epsMeta: ITitleEpisodeMeta[] | null,
  updatedAt: number,
  details: string | null
}

export interface IDubber {
  id: string,
  code: string,
  name: string,
  thumbURL: string,
  socials: {
    telegram: string | null,
    instagram: string | null,
    youtube: string | null,
    tiktok: string | null
  },
  support: {
    diaka: string | null,
    monobank: string | null,
    privatbank: string | null,
    bymeacoffee: string | null,
    patreon: string | null
  },
  createdAt: number,
  description: string | null,
  leader: string | null,
  editors: string[] | null,
  members: string[] | null,
  rating: number
}

export interface IUser {
  uid: string,
  username: string,
  password: string,
  email: string,
  avatar: string,
  profileBg: string | null,
  badgesIDs: string[] | null,
  settings: IUserSettings,
  stats: IUserStats,
  lists: IUserList[],
  providers: TAuthProviders[],
  roles: TUserRoles[]
}

export interface IStat {
  id: string,
  timestamp: number,
  online: {
    total: number,
    peak: number,
    avg: number
  },
  createdAccounts: number,
  seriesUploaded: number,
  titlesCreated: number,
  titlesUpdated: number,
  popularDub: string,
  totalWatchtimeS: number,
  titles: {
    popularTitle: string,
    popularDub: string,
    top30: IStatTitle[],
    total: IStatTitle[],
  }
}

export interface IStatTitle {
  id: string,
  watchtimeS: number,
  dubs: {
    id: string,
    watchtimeS: number
  }[]
}

export interface IStatRecord {
  title: string,
  selectedDub: string,
  watchtime: number
}
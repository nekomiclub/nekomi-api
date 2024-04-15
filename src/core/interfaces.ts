import { TAuthProviders } from './IAuth';
import { ITitleEpisodeMeta, ITitleEpisodesDub } from './ITitle';
import { IUserList, IUserSettings, IUserStats, TUserRoles } from './IUser';

/** @deprecated use new ITitle interface from interfaces/Title.ts/ITitle */
export type TAnimeGenres = 'chinese' | '3D' | 'shonen' | 'shounenAi' | 'seinen' | 'shoujoAi' | 'shoujo' | 'comedy' | 'romance' | 'school' | 'martial arts' | 'vampires' | 'military' | 'harem' | 'demons' | 'detective' | 'drama' | 'games' | 'historical' | 'isekai' | 'magic' | 'mecha' | 'music' | 'parody' | 'sliceOfLife' | 'adventure' | 'psychological' | 'samurai' | 'supernatural' | 'sports' | 'superpower' | 'horror' | 'sciFi' | 'fantasy' | 'action' | 'ecchi' | 'thriller' | 'erotica' | 'gourmet';

/** @deprecated use new ITitle interface from interfaces/Title.ts/ITitle */
export type TAnimeAgeRatings = 'G' | 'PG' | 'PG-13' | 'R-17' | 'R+' // G - All; Ages PG - Children; PG-13 - Teens 13 or older; R17 - 17+ (violence & profanity) R+ - Mild Nudity;

/** @deprecated use new ITitle interface from interfaces/Title.ts/ITitle */
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

/** User object interface
 * @deprecated use interfaces/User.ts/IUser insead
 */
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
  roles: TUserRoles[],
  accountType: 'old' | 'new'
}

export interface IStat {
  timestamp: number,
  online: {
    min: number,
    max: number,
    total: number,
    avg: number
  },
  titles: {
    id: string,
    dubs: {
      id: string
      watchtime: number
    }[],
    totalWatchtime: number
  }[],
  seriesUploaded: number,
  titlesUpdated: number
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



export interface IANIMEE_CONFIG {
  /** @deprecated use data in services instead */
  PORTS: {
    BASE_PORT: number,

    CORE: {
      HTTP: number,
      HTTPS: number
    },

    ANIMEE_UPLOADS: {
      MSID: number
    },
    ANIMEE_UPLOADS_BOT: {
      MSID: number
    },
    MONGODB: {
      PORT: number,
      HOST: string
    }
  },
  SERVICES: {
    DB: {
      PORT: number,
      HOST: number,
    },

    ANIMEE_CORE: IANIMEE_CONFIG_SERVICE,
    ANIMEE_MEDIA: IANIMEE_CONFIG_SERVICE,
    ANIMEE_UPLOADS: IANIMEE_CONFIG_SERVICE,
    ANIMEE_UPLOADS_BOT: IANIMEE_CONFIG_SERVICE,
  }
}

interface IANIMEE_CONFIG_SERVICE {
  HOST: string,
  PORTS: {
    HTTP: number,
    HTTPS: number | null,
    WS: number | null
  },
  DB: {
    DEV: {
      DB_NAME: string,
      USR: string,
      PWD: string
    },
    PROD: {
      DB_NAME: string,
      USR: string,
      PWD: string
    }
  } | null
}
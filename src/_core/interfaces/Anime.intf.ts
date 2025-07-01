import { DayOfWeek } from '~/core/interfaces/types';



export interface Anime {
  uuid: string
  slug: string
  poster: string
  year: number
  episodesCount: number | null
  description: string | null
  details: string | null
  broadcast: AnimeBroadcast | null
  genres: ANIME_GENRE[]
  rate: ANIME_RATE
  status: ANIME_STATUS
  season: ANIME_SEASON
  media: ANIME_MEDIA_TYPE
  studios: AnimeStudio[]
  malId: number | null

  /** UTC timestamp @private */
  updatedAt: number
  /** UTC timestamp @private */
  createdAt: number
  /** MAL sync UTC timestamp @private */
  malSyncedAt: number | null
  /** Shikimori sync UTC timestamp @since 2.1.1 @private */
  shikimoriSyncedAt: number | null
  /** AniDB sync UTC timestamp @since 2.1.1 @private */
  anidbSyncedAt: number | null
  /** hikka.io sync UTC timestamp @since 2.1.1 @private */
  hikkaSyncedAt: number | null

  /** @private */
  episodes: AnimeEpisode[]
  /** @private */
  episodesMeta: AnimeEpisodeMeta[]
  /** Anime pictures URL's @private */
  pictures: string[]
  /** Related animes ID's @private */
  related: string[]
  /** Poster adapted by dubber ID */
  posterAdapt: string | null

  /** Prevent services sync @private */
  stopSync: {
    mal?: boolean
    shikimori?: boolean
    /** @since 2.1.1 */
    anidb?: boolean
    /** @since 2.1.1 */
    hikka?: boolean
  }

  score: {
    imdb: number | null
    mal: number | null
    malScoredBy: number | null
  }

  names: {
    eng: string
    ukr: string
    alt: string[]
  }
}

export interface HydratedAnime {
  anime: Anime
  genres: AnimeGenre[]
  media: AnimeMedia
  rate: AnimeRate
  season: AnimeSeason
  status: AnimeStatus
}

export interface AnimeEpisode {
  dubberID: string
  order: number
  qualities: {
    /** Primary quality */
    q1080: string

    q4k: string | null
    q720: string | null
    q480: string | null
    q240: string | null
  }

  /** Frames URLs in order from 0 array */
  frames: string[]
}

export interface AnimeEpisodeMeta {
  order: number
  names: {
    ukr: string
    eng: string
  }

  /** UTC-0 timestamp */
  dateOut: number
}

export interface AnimeBroadcast {
  day: DayOfWeek

  /** Time of the broadcast. E.g 19:30 */
  time: string
}

export interface AnimeStudio {
  malId: number
  name: string
}

export type AnimeGenre = KeyValueDescription<ANIME_GENRE>
export type AnimeRate = KeyValueDescription<ANIME_RATE>;
export type AnimeStatus = KeyValue<ANIME_STATUS>;
export type AnimeSeason = KeyValue<ANIME_SEASON>;
export type AnimeMedia = KeyValue<ANIME_MEDIA_TYPE>;




interface KeyValue<T = string> {
  slug: T
  name: string
}

interface KeyValueDescription<T = string> extends KeyValue<T> {
  description: string
}



export enum ANIME_GENRE {
  ACTION = 'action',
  ADVENTURE = 'adventure',
  CARS = 'cars',
  COMEDY = 'comedy',
  DEMENTIA = 'dementia',
  DEMONS = 'demons',
  DRAMA = 'drama',
  ECCHI = 'ecchi',
  FANTASY = 'fantasy',
  GAME = 'game',
  HAREM = 'harem',
  HENTAI = 'hentai',
  HISTORICAL = 'historical',
  HORROR = 'horror',
  JOSEI = 'josei',
  KIDS = 'kids',
  MAGIC = 'magic',
  MARTIAL_ARTS = 'martialArts',
  MECHA = 'mecha',
  MILITARY = 'military',
  MUSIC = 'music',
  MYSTERY = 'mystery',
  PARODY = 'parody',
  POLICE = 'police',
  PSYCHOLOGICAL = 'psychological',
  ROMANCE = 'romance',
  SAMURAI = 'samurai',
  SCHOOL = 'school',
  SCI_FI = 'sciFi',
  SEINEN = 'seinen',
  SHOUJO = 'shoujo',
  SHOUJO_AI = 'shoujoAi',
  SHOUNEN = 'shounen',
  SHOUNEN_AI = 'shounenAi',
  SLICE_OF_LIFE = 'sliceOfLife',
  SPACE = 'space',
  SPORTS = 'sports',
  SUPER_POWER = 'superPower',
  SUPERNATURAL = 'supernatural',
  THRILLER = 'thriller',
  VAMPIRE = 'vampire',
  YAOI = 'yaoi',
  YURI = 'yuri',
}

export enum ANIME_RATE {
  /** All ages */
  G = 'g',

  /** Children */
  PG = 'pg',

  /** Teens 13+ */
  PG13 = 'pg_13',

  /** 17+ (violence) */
  R17 = 'r',

  /** 18+ (mild nudity) */
  RPLUS = 'r+',

  /** hentai */
  RX = 'rx',
}

export enum ANIME_STATUS {
  FINISHED_AIRING = 'finished_airing',
  CURRENTLY_AIRING = 'currently_airing',
  NOT_YET_AIRED = 'not_yet_aired',
}

export enum ANIME_SEASON {
  SUMMER = 'summer',
  FALL = 'fall',
  WINTER = 'winter',
  SPRING = 'spring',
}

export enum ANIME_MEDIA_TYPE {
  TV = 'tv',
  OVA = 'ova',
  MOVIE = 'movie',
  SPECIAL = 'special',
  ONA = 'ona',
  UNKNOWN = 'unknown',
}



export const ANIME_GENRES: Record<ANIME_GENRE, AnimeGenre> = {
  [ANIME_GENRE.ACTION]: {
    slug: ANIME_GENRE.ACTION,
    name: 'Бойовик',
    description: 'Аніме, сповнені адреналіну, бійками, погонями та вибухами.',
  },
  [ANIME_GENRE.ADVENTURE]: {
    slug: ANIME_GENRE.ADVENTURE,
    name: 'Пригоди',
    description: 'Аніме про подорожі, дослідження та небезпечні випробування.',
  },
  [ANIME_GENRE.CARS]: {
    slug: ANIME_GENRE.CARS,
    name: 'Автомобілі',
    description: "Аніме про гонки, автомобілі та все, що пов'язано з ними.",
  },
  [ANIME_GENRE.COMEDY]: {
    slug: ANIME_GENRE.COMEDY,
    name: 'Комедія',
    description: 'Аніме з веселощами та гумором, що змусять вас сміятися.',
  },
  [ANIME_GENRE.DEMENTIA]: {
    slug: ANIME_GENRE.DEMENTIA,
    name: 'Деменція',
    description: 'Аніме з дивною, нелогічною та часто сюрреалістичною атмосферою.',
  },
  [ANIME_GENRE.DEMONS]: {
    slug: ANIME_GENRE.DEMONS,
    name: 'Демони',
    description: 'Аніме про демонів, боротьбу з ними та надприродні сили.',
  },
  [ANIME_GENRE.DRAMA]: {
    slug: ANIME_GENRE.DRAMA,
    name: 'Драма',
    description: 'Аніме з серйозними емоціями, що досліджують людські стосунки та переживання.',
  },
  [ANIME_GENRE.ECCHI]: {
    slug: ANIME_GENRE.ECCHI,
    name: 'Еччі',
    description: 'Аніме з елементами еротики, але без відвертих сцен.',
  },
  [ANIME_GENRE.FANTASY]: {
    slug: ANIME_GENRE.FANTASY,
    name: 'Фентезі',
    description: 'Аніме про магію, чарівників, міфічних істот та інші фантастичні світи.',
  },
  [ANIME_GENRE.GAME]: {
    slug: ANIME_GENRE.GAME,
    name: 'Ігри',
    description: 'Аніме, засноване на іграх або про ігри.',
  },
  [ANIME_GENRE.HAREM]: {
    slug: ANIME_GENRE.HAREM,
    name: 'Гарем',
    description: 'Аніме, де головний герой оточений багатьма дівчатами.',
  },
  [ANIME_GENRE.HENTAI]: {
    slug: ANIME_GENRE.HENTAI,
    name: 'Хентай',
    description: 'Аніме з відвертими еротичними сценами.',
  },
  [ANIME_GENRE.HISTORICAL]: {
    slug: ANIME_GENRE.HISTORICAL,
    name: 'Історичний',
    description: 'Аніме, що відбувається в минулому та розповідає про історичні події.',
  },
  [ANIME_GENRE.HORROR]: {
    slug: ANIME_GENRE.HORROR,
    name: 'Жахи',
    description: 'Аніме, що має на меті налякати глядача.',
  },
  [ANIME_GENRE.JOSEI]: {
    slug: ANIME_GENRE.JOSEI,
    name: 'Дзьосей',
    description: 'Аніме, орієнтоване на дорослу жіночу аудиторію.',
  },
  [ANIME_GENRE.KIDS]: {
    slug: ANIME_GENRE.KIDS,
    name: 'Дитячий',
    description: 'Аніме для дітей.',
  },
  [ANIME_GENRE.MAGIC]: {
    slug: ANIME_GENRE.MAGIC,
    name: 'Магія',
    description: 'Аніме про чарівництво та магічні сили.',
  },
  [ANIME_GENRE.MARTIAL_ARTS]: {
    slug: ANIME_GENRE.MARTIAL_ARTS,
    name: 'Бойові мистецтва',
    description: 'Аніме про різні види бойових мистецтв.',
  },
  [ANIME_GENRE.MECHA]: {
    slug: ANIME_GENRE.MECHA,
    name: 'Меха',
    description: 'Аніме про гігантських роботів.',
  },
  [ANIME_GENRE.MILITARY]: {
    slug: ANIME_GENRE.MILITARY,
    name: 'Військовий',
    description: 'Аніме про війну та військових.',
  },
  [ANIME_GENRE.MUSIC]: {
    slug: ANIME_GENRE.MUSIC,
    name: 'Музика',
    description: 'Аніме про музику та музикантів.',
  },
  [ANIME_GENRE.MYSTERY]: {
    slug: ANIME_GENRE.MYSTERY,
    name: 'Детектив',
    description: 'Аніме з загадками та розслідуваннями.',
  },
  [ANIME_GENRE.PARODY]: {
    slug: ANIME_GENRE.PARODY,
    name: 'Пародія',
    description: 'Аніме-пародія на інші твори.',
  },
  [ANIME_GENRE.POLICE]: {
    slug: ANIME_GENRE.POLICE,
    name: 'Поліція',
    description: 'Аніме про роботу поліції.',
  },
  [ANIME_GENRE.PSYCHOLOGICAL]: {
    slug: ANIME_GENRE.PSYCHOLOGICAL,
    name: 'Психологічний',
    description: 'Аніме, що досліджує психологію персонажів.',
  },
  [ANIME_GENRE.ROMANCE]: {
    slug: ANIME_GENRE.ROMANCE,
    name: 'Романтика',
    description: 'Аніме про любовні стосунки.',
  },
  [ANIME_GENRE.SAMURAI]: {
    slug: ANIME_GENRE.SAMURAI,
    name: 'Самураї',
    description: 'Аніме про самураїв та їхній кодекс честі.',
  },
  [ANIME_GENRE.SCHOOL]: {
    slug: ANIME_GENRE.SCHOOL,
    name: 'Школа',
    description: 'Аніме про шкільне життя.',
  },
  [ANIME_GENRE.SCI_FI]: {
    slug: ANIME_GENRE.SCI_FI,
    name: 'Наукова фантастика',
    description: 'Аніме про майбутнє, технології та космос.',
  },
  [ANIME_GENRE.SEINEN]: {
    slug: ANIME_GENRE.SEINEN,
    name: 'Сейнен',
    description: 'Аніме, орієнтоване на дорослу чоловічу аудиторію.',
  },
  [ANIME_GENRE.SHOUJO]: {
    slug: ANIME_GENRE.SHOUJO,
    name: 'Шьодзьо',
    description: 'Аніме, орієнтоване на дівчачу аудиторію.',
  },
  [ANIME_GENRE.SHOUJO_AI]: {
    slug: ANIME_GENRE.SHOUJO_AI,
    name: 'Шьодзьо-ай',
    description: 'Аніме про романтичні стосунки між дівчатами.',
  },
  [ANIME_GENRE.SHOUNEN]: {
    slug: ANIME_GENRE.SHOUNEN,
    name: 'Шьонен',
    description: 'Аніме, орієнтоване на хлопчачу аудиторію.',
  },
  [ANIME_GENRE.SHOUNEN_AI]: {
    slug: ANIME_GENRE.SHOUNEN_AI,
    name: 'Шьонен-ай',
    description: 'Аніме про романтичні стосунки між хлопцями.',
  },
  [ANIME_GENRE.SLICE_OF_LIFE]: {
    slug: ANIME_GENRE.SLICE_OF_LIFE,
    name: 'Повсякденність',
    description: 'Аніме про звичайне життя та повсякденні ситуації.',
  },
  [ANIME_GENRE.SPACE]: {
    slug: ANIME_GENRE.SPACE,
    name: 'Космос',
    description: 'Аніме про космічні подорожі та дослідження.',
  },
  [ANIME_GENRE.SPORTS]: {
    slug: ANIME_GENRE.SPORTS,
    name: 'Спорт',
    description: 'Аніме про різні види спорту.',
  },
  [ANIME_GENRE.SUPER_POWER]: {
    slug: ANIME_GENRE.SUPER_POWER,
    name: 'Суперсили',
    description: 'Аніме про людей з надзвичайними здібностями.',
  },
  [ANIME_GENRE.SUPERNATURAL]: {
    slug: ANIME_GENRE.SUPERNATURAL,
    name: 'Надприродне',
    description: 'Аніме про привидів, демонів, духів та інші надприродні явища.',
  },
  [ANIME_GENRE.THRILLER]: {
    slug: ANIME_GENRE.THRILLER,
    name: 'Трилер',
    description: 'Напружені та захоплюючі історії, що тримають глядача в напрузі.',
  },
  [ANIME_GENRE.VAMPIRE]: {
    slug: ANIME_GENRE.VAMPIRE,
    name: 'Вампіри',
    description: 'Аніме про вампірів та їхнє життя.',
  },
  [ANIME_GENRE.YAOI]: {
    slug: ANIME_GENRE.YAOI,
    name: 'Яой',
    description: 'Аніме про романтичні стосунки між чоловіками.',
  },
  [ANIME_GENRE.YURI]: {
    slug: ANIME_GENRE.YURI,
    name: 'Юрі',
    description: 'Аніме про романтичні стосунки між жінками.',
  },
};

export const ANIME_RATES: Record<ANIME_RATE, AnimeRate> = {
  [ANIME_RATE.G]: {
    slug: ANIME_RATE.G,
    name: 'G',
    description: 'Аніме, для глядачів будь-якого віку.',
  },
  [ANIME_RATE.PG]: {
    slug: ANIME_RATE.PG,
    name: 'PG',
    description: 'Аніме, для дітей.',
  },
  [ANIME_RATE.PG13]: {
    slug: ANIME_RATE.PG13,
    name: 'PG-13',
    description: 'Аніме, для підлітків. (13+)',
  },
  [ANIME_RATE.R17]: {
    slug: ANIME_RATE.R17,
    name: 'R-17',
    description: 'Аніме, що містить сцени насильства. (17+)',
  },
  [ANIME_RATE.RPLUS]: {
    slug: ANIME_RATE.RPLUS,
    name: 'R+',
    description: 'Аніме, що містить елементи еротики. (18+)',
  },
  [ANIME_RATE.RX]: {
    slug: ANIME_RATE.RX,
    name: 'Rx',
    description: 'Аніме з відвертими еротичними сценами. (18+)',
  },
};

export const ANIME_STATUSES: Record<ANIME_STATUS, AnimeStatus> = {
  [ANIME_STATUS.CURRENTLY_AIRING]: {
    slug: ANIME_STATUS.CURRENTLY_AIRING,
    name: 'Онґоїнг',
  },
  [ANIME_STATUS.NOT_YET_AIRED]: {
    slug: ANIME_STATUS.NOT_YET_AIRED,
    name: 'Анонс',
  },
  [ANIME_STATUS.FINISHED_AIRING]: {
    slug: ANIME_STATUS.FINISHED_AIRING,
    name: 'Вийшов',
  }
};

export const ANIME_SEASONS: Record<ANIME_SEASON, AnimeSeason> = {
  [ANIME_SEASON.FALL]: {
    slug: ANIME_SEASON.FALL,
    name: 'Осінь',
  },
  [ANIME_SEASON.SPRING]: {
    slug: ANIME_SEASON.SPRING,
    name: 'Весна',
  },
  [ANIME_SEASON.SUMMER]: {
    slug: ANIME_SEASON.SUMMER,
    name: 'Літо',
  },
  [ANIME_SEASON.WINTER]: {
    slug: ANIME_SEASON.WINTER,
    name: 'Зима',
  },
};

export const ANIME_MEDIA_TYPES: Record<ANIME_MEDIA_TYPE, AnimeMedia> = {
  [ANIME_MEDIA_TYPE.MOVIE]: {
    slug: ANIME_MEDIA_TYPE.MOVIE,
    name: 'Фільм',
  },
  [ANIME_MEDIA_TYPE.ONA]: {
    slug: ANIME_MEDIA_TYPE.ONA,
    name: 'ОНА',
  },
  [ANIME_MEDIA_TYPE.OVA]: {
    slug: ANIME_MEDIA_TYPE.OVA,
    name: 'ОВА',
  },
  [ANIME_MEDIA_TYPE.SPECIAL]: {
    slug: ANIME_MEDIA_TYPE.SPECIAL,
    name: 'Спешл',
  },
  [ANIME_MEDIA_TYPE.TV]: {
    slug: ANIME_MEDIA_TYPE.TV,
    name: 'Серіал',
  },
  [ANIME_MEDIA_TYPE.UNKNOWN]: {
    slug: ANIME_MEDIA_TYPE.UNKNOWN,
    name: 'Невідомо',
  },
};

/** 
 * Anime seasons sorted by month index
 * 
 * @example {this}[6] - summer
 */
export const AnimeMonthSeasons: ANIME_SEASON[] = [
  ANIME_SEASON.WINTER, ANIME_SEASON.WINTER,
  ANIME_SEASON.SPRING, ANIME_SEASON.SPRING, ANIME_SEASON.SPRING,
  ANIME_SEASON.SUMMER, ANIME_SEASON.SUMMER, ANIME_SEASON.SUMMER,
  ANIME_SEASON.FALL, ANIME_SEASON.FALL, ANIME_SEASON.FALL,
  ANIME_SEASON.WINTER,
];

export default Anime;
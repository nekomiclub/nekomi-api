import { DayOfWeek } from '~/core/interfaces/types';



export interface Anime {
  uuid: string
  poster: string
  year: number
  episodesCount: number | null
  description: string | null
  details: string | null

  /** UTC-0 timestamp */
  updatedAt: number

  /** @private */
  episodes: AnimeEpisode[]
  /** @private */
  episodesMeta: AnimeEpisodeMeta[]

  names: {
    eng: string
    ukr: string
    alt: string[]
  },

  /** @since 2.1.0 */
  broadcast: AnimeBroadcast | null
  /** @since 2.1.0 */
  genresNew: AnimeGenreType[]
  /** @since 2.1.0 */
  rate: AnimeRateType
  /** @since 2.1.0 */
  statusNew: AnimeStatusType
  /** @since 2.1.0 */
  seasonNew: AnimeSeasonType
  /** @since 2.1.0 */
  media: AnimeMediaType
  /** @since 2.1.0 */
  studiosNew: AnimeStudio[]
  /** @since 2.1.0 */
  malId: number | null
  /** MAL sync UTC-0 timestamp @since 2.1.0 */
  malSyncedAt: number | null
  /** @since 2.1.0 */
  slug: string
  /** Anime pictures URL's @since 2.1.0 */
  pictures: string[]
  /** Related animes ID's @since 2.1.0 */
  related: string[]
  /** Poster adapted by dubber ID @since 2.1.0 */
  posterAdapt: string | null

  /** @since 2.1.0 */
  score: {
    imdb: number | null
    mal: number | null
    malScoredBy: number | null
  }



  /** Code (url encoded eng name) @deprecated use slug instead */
  code: string

  /** @deprecated */
  rating: {
    /** @deprecated use score.imdb */
    IMDB: number | null
    /** @since 1.3.2
     * @deprecated use score.mal
     */
    mal: number | null
    /** MAL rated by
     * @since 1.3.2
     * @deprecated use score.malScoredBy
     */
    mal_poll: number | null
    /** @deprecated 1.3.2 */
    Animee: number | null
  }

  /** @deprecated use uuid instead */
  id: string
  /** @since 1.3.2 @deprecated use malId instead */
  mal_id: string | null

  /** @deprecated */
  country: TTitleCountry
  /** @deprecated use genresNew instead */
  genres: TAnimeGenre[]
  /** @deprecated use rate instead */
  ageRate: TAnimeAgeRate
  /** @deprecated use statusNew instead */
  status: TAnimeStatus
  /** @deprecated use seasonNew instead */
  season: TAnimeSeason
  /** @deprecated use media instead */
  type: TTitleType
  /** @deprecated use studiosNew instead */
  studios: string[]
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
  id: string
  name: string
}

export type AnimeGenre = KeyValueDescription<AnimeGenreType>
export type AnimeRate = KeyValueDescription<AnimeRateType>;
export type AnimeStatus = KeyValue<AnimeStatusType>;
export type AnimeSeason = KeyValue<AnimeSeasonType>;
export type AnimeMedia = KeyValue<AnimeMediaType>;




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



export type AnimeGenreType = `${ANIME_GENRE}`;
export type AnimeRateType = `${ANIME_RATE}`;
export type AnimeStatusType = `${ANIME_STATUS}`;
export type AnimeSeasonType = `${ANIME_SEASON}`;
export type AnimeMediaType = `${ANIME_MEDIA_TYPE}`;



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
    name: 'Вийшло',
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

















/** Array of anime genres provided on nekomi.club @deprecated */
export const AnimeGenresOld = ['chinese', '3D', 'shonen', 'shounenAi', 'seinen', 'shoujoAi', 'shoujo', 'comedy', 'romance', 'school', 'martial arts', 'vampires', 'military', 'harem', 'demons', 'detective', 'drama', 'games', 'historical', 'isekai', 'magic', 'mecha', 'music', 'parody', 'sliceOfLife', 'adventure', 'psychological', 'samurai', 'supernatural', 'sports', 'superpower', 'horror', 'sciFi', 'fantasy', 'action', 'ecchi', 'thriller', 'erotica', 'gourmet'] as const;
/** @deprecated */
export type TAnimeGenre = typeof AnimeGenresOld[number];

/** Array of anime age ratings on nekomi.club
 * G - All Ages
 * PG - Children
 * PG-13 - Teens 13 or older
 * R17 - 17+ (violence & profanity)
 * R+ - Mild Nudity
 * Rx - Full nudity (not presented on nekomi.club, but?)
 * @deprecated
 */
export const AnimeAgeRatesOld = ['G', 'PG', 'PG-13', 'R-17', 'R+', 'Rx'] as const;
/** @deprecated */
export type TAnimeAgeRate = typeof AnimeAgeRatesOld[number];

/** Array of anime statuses @deprecated */
export const AnimeStatusesOld = ['announcement', 'ongoing', 'out', 'delayed'] as const;
/** @deprecated */
export type TAnimeStatus = typeof AnimeStatusesOld[number]

/** Array of anime streaming seasons @deprecated */
export const AnimeSeasonsOld = ['summer', 'autumn', 'winter', 'spring'] as const;
/** @deprecated */
export type TAnimeSeason = typeof AnimeSeasonsOld[number]

/** Array of title types @deprecated */
export const TitleTypesOld = ['serial', 'ONA', 'OVA', 'film', 'special'] as const;
/** @deprecated */
export type TTitleType = typeof TitleTypesOld[number]

/** Array of title contries @deprecated */
export const TitleCountriesOld = ['Japan', 'South Corea', 'China', 'Other'] as const;
/** @deprecated */
export type TTitleCountry = typeof TitleCountriesOld[number]



export interface AnimeMetadata {
  title: string
  description: string
  keywords: string[]
  photo: string
}

export interface AnimeRelated {
  uuid: Anime['uuid']
  slug: Anime['slug']
  posterURL: Anime['poster']
  genres: AnimeGenre[]
  malScore: Anime['score']['mal']
  nameUkr: Anime['names']['ukr']
  episodesCount: Anime['episodesCount']
}



export default Anime;
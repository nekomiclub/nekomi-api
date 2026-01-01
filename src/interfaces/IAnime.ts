import { CDNString, ISODateString } from './types';



export interface IAnimePosterNode {
  small: CDNString
  medium: CDNString
  original: CDNString

  authorId: string | null
  is_hero: boolean
  pull_hash: string

  _unprocessedAuthorName?: string
}

export interface IAnimeScreenshotNode {
  preview: CDNString
  original: CDNString

  pull_hash: string
}

export interface IAnime {
  id: string
  mal_id: number | null
  imdb_id: string | null
  slug: string
  hikka_slug: string | null

  posters: IAnimePosterNode[] // Protected
  hero_poster_author: string | null // Protected

  year: number | null
  episodes_total: number | null
  episodes_released: number | null

  title_ja: string | null
  title_en: string | null
  title_ua: string | null
  title_synonims: string[]

  synopsis_en: string | null
  synopsis_ua: string | null

  score: number
  scored_by: number

  /** Related anime documents */
  relations: IAnimeRelation[] // Protected
  studios: IAnimeStudio[]
  screenshots: IAnimeScreenshotNode[] // Protected
  schedule: IAnimeSchedule[]
  episodes: IAnimeEpisode[] // Protected
  episodes_meta: IAnimeEpisodeMeta[] // Protected

  genres: ANIME_GENRE[]
  rating: ANIME_RATING | null
  status: ANIME_STATUS | null
  season: ANIME_SEASON | null
  type: ANIME_TYPE | null

  updated_at: ISODateString // Protected
  created_at: ISODateString // Protected
  hikka_sync: ISODateString | null // Protected
  myanimelist_sync: ISODateString | null // Protected

  /** Is anime restricted under DMCA */
  is_DMCA_restricted?: boolean
}

export interface IAnimeRelation {
  mal_id: number
  type: string // anime, manga, etc..
  relation: string // Prequel, Sequel, etc...
}

export interface IAnimeStudio {
  mal_id: number
  name: string
}

export interface IAnimeEpisode {
  episode: number
  dubberId: string

  qualities: {
    q4k: string | null
    q1080: string | null
    q720: string | null
    q480: string | null
    q240: string | null
  }

  /** Frames URLs in order from 0 array */
  frames: string[]
}

export interface IAnimeEpisodeMeta {
  episode: number
  title: string
  aired: ISODateString | null
  score: number | null // 1 - 5
  filler: boolean
  recap: boolean
}

export interface IAnimeSchedule {
  episode: number
  airing_at: ISODateString
}



export type AnimeCardType = Pick<IAnime, 'id' | 'slug' | 'episodes_total' | 'score'> & {
  title: string
  poster: CDNString
  genres: AnimeGenreType[]
}



type AnimeNamedRecordType<T = string> = {
  slug: T
  name: string
}

type AnimeNamedDescriptionRecordType<T = string> = AnimeNamedRecordType<T> & {
  description: string
}

export type AnimeGenreType = AnimeNamedDescriptionRecordType<ANIME_GENRE>
export type AnimeRateType = AnimeNamedDescriptionRecordType<ANIME_RATING>;
export type AnimeStatusType = AnimeNamedRecordType<ANIME_STATUS>;
export type AnimeSeasonType = AnimeNamedRecordType<ANIME_SEASON>;
export type AnimeType = AnimeNamedRecordType<ANIME_TYPE>;



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

export enum ANIME_RATING {
  G = 'g',
  PG = 'pg',
  PG13 = 'pg_13',
  R17 = 'r',
  RPLUS = 'r_plus',
  RX = 'rx',
}

export enum ANIME_STATUS {
  FINISHED = 'finished',
  ONGOING = 'ongoing',
  ANNOUNCED = 'announced',
}

export enum ANIME_SEASON {
  SUMMER = 'summer',
  FALL = 'fall',
  WINTER = 'winter',
  SPRING = 'spring',
}

export enum ANIME_TYPE {
  TV = 'tv',
  OVA = 'ova',
  MOVIE = 'movie',
  SPECIAL = 'special',
  ONA = 'ona',
  UNKNOWN = 'unknown',
}



export const AnimeGenres: Record<ANIME_GENRE, AnimeGenreType> = {
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

export const AnimeRatings: Record<ANIME_RATING, AnimeRateType> = {
  [ANIME_RATING.G]: {
    slug: ANIME_RATING.G,
    name: 'G',
    description: 'Аніме, для глядачів будь-якого віку.',
  },
  [ANIME_RATING.PG]: {
    slug: ANIME_RATING.PG,
    name: 'PG',
    description: 'Аніме, для дітей.',
  },
  [ANIME_RATING.PG13]: {
    slug: ANIME_RATING.PG13,
    name: 'PG-13',
    description: 'Аніме, для підлітків. (13+)',
  },
  [ANIME_RATING.R17]: {
    slug: ANIME_RATING.R17,
    name: 'R-17',
    description: 'Аніме, що містить сцени насильства. (17+)',
  },
  [ANIME_RATING.RPLUS]: {
    slug: ANIME_RATING.RPLUS,
    name: 'R+',
    description: 'Аніме, що містить елементи еротики. (18+)',
  },
  [ANIME_RATING.RX]: {
    slug: ANIME_RATING.RX,
    name: 'Rx',
    description: 'Аніме з відвертими еротичними сценами. (18+)',
  },
};

export const AnimeStatuses: Record<ANIME_STATUS, AnimeStatusType> = {
  [ANIME_STATUS.ONGOING]: {
    slug: ANIME_STATUS.ONGOING,
    name: 'Онґоїнг',
  },
  [ANIME_STATUS.ANNOUNCED]: {
    slug: ANIME_STATUS.ANNOUNCED,
    name: 'Анонс',
  },
  [ANIME_STATUS.FINISHED]: {
    slug: ANIME_STATUS.FINISHED,
    name: 'Вийшов',
  }
};

export const AnimeSeasons: Record<ANIME_SEASON, AnimeSeasonType> = {
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

export const AnimeTypes: Record<ANIME_TYPE, AnimeType> = {
  [ANIME_TYPE.MOVIE]: {
    slug: ANIME_TYPE.MOVIE,
    name: 'Фільм',
  },
  [ANIME_TYPE.ONA]: {
    slug: ANIME_TYPE.ONA,
    name: 'ОНА',
  },
  [ANIME_TYPE.OVA]: {
    slug: ANIME_TYPE.OVA,
    name: 'ОВА',
  },
  [ANIME_TYPE.SPECIAL]: {
    slug: ANIME_TYPE.SPECIAL,
    name: 'Спешл',
  },
  [ANIME_TYPE.TV]: {
    slug: ANIME_TYPE.TV,
    name: 'Серіал',
  },
  [ANIME_TYPE.UNKNOWN]: {
    slug: ANIME_TYPE.UNKNOWN,
    name: 'Невідомо',
  },
};




export default IAnime;
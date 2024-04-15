/** Array of anime genres provided on animee.club */
export const AnimeGenres = ['chinese', '3D', 'shonen', 'shounenAi', 'seinen', 'shoujoAi', 'shoujo', 'comedy', 'romance', 'school', 'martial arts', 'vampires', 'military', 'harem', 'demons', 'detective', 'drama', 'games', 'historical', 'isekai', 'magic', 'mecha', 'music', 'parody', 'sliceOfLife', 'adventure', 'psychological', 'samurai', 'supernatural', 'sports', 'superpower', 'horror', 'sciFi', 'fantasy', 'action', 'ecchi', 'thriller', 'erotica', 'gourmet'] as const;

/** Type that implements AnimeGenres */
export type TAnimeGenre = typeof AnimeGenres[number];

/** Array of anime age ratings on animee.club
 * G - All Ages
 * PG - Children
 * PG-13 - Teens 13 or older
 * R17 - 17+ (violence & profanity)
 * R+ - Mild Nudity
 * Rx - Full nudity (not presented on animee.club, but?)
 */
export const AnimeAgeRates = ['G', 'PG', 'PG-13', 'R-17', 'R+', 'Rx'] as const;

/** Type that implements AnimeAgeRates */
export type TAnimeAgeRate = typeof AnimeAgeRates[number];

/** Array of anime statuses */
export const AnimeStatuses = ['announcement', 'ongoing', 'out', 'delayed'] as const;

/** Type that implements AnimeStatuses */
export type TAnimeStatus = typeof AnimeStatuses[number]

/** Array of anime streaming seasons */
export const AnimeSeasons = ['summer', 'autumn', 'winter', 'spring'] as const;

/** Type that implements AnimeSeasons */
export type TAnimeSeason = typeof AnimeSeasons[number]

/** Array of title types */
export const TitleTypes = ['serial', 'ONA', 'OVA', 'film', 'special'] as const;

/** Type that implements TitleTypes */
export type TTitleType = typeof TitleTypes[number]






/** Title object */
export interface ITitle {
  /** Title ID */
  id: string

  /** Object of title names */
  names: {
    /** Name on English */
    eng: string

    /** Name on Ukranian */
    ukr: string

    /** Alt names (Japan, russian) */
    alt: string[] | null
  },

  /** Title code */
  code: string

  /** Title poster */
  poster: string

  /** Title background
   * @deprecated due to zero impact
   */
  background: string

  /** Title rating
   * Will be deprecated in near future
   */
  rating: number | null

  /** Title description */
  description: string

  /** Title status */
  status: TAnimeStatus

  /** Title estimated eps
   * Will be deprecated in near future
   */
  estimatedEps: number

  /** Title genres */
  genres: TAnimeGenre[]

  /** Title age rating */
  ageRate: TAnimeAgeRate

  /** Anime streaming season */
  season: TAnimeSeason

  /** Title type */
  type: TTitleType

  /** Title aired year */
  year: number

  /** Title studios created */
  studios: string[]

  /** Title country created
   * Will be deprecated in near future
   */
  country: string

  /** Title started timestamp
   * @deprecated
   */
  started: number | null

  /** Title ended timestamp
    * @deprecated
    */
  ended: number | null

  /** Title dubs
   * Will be refactored in near future
   */
  dubs: ITitleEpisodesDub[] | null

  /** Title episodes metas */
  epsMeta: ITitleEpisodeMeta[] | null

  /** Updated at timestamp */
  updatedAt: number

  /** Some text details (poster translated by, dubs cooperated, etc) */
  details: string | null
}

/** Title dub */
export interface ITitleEpisodesDub {
  /** Dubbers ID */
  id: string

  /** Include subs flag
   * @deprecated
   */
  includeSub: boolean

  /** Include 2K quality flag
   * @deprecated
   */
  include2K: boolean

  /** Episodes */
  eps: ITitleEpisodeDubbed[]
}

/** Title dubbed episode */
export interface ITitleEpisodeDubbed {
  /** Episode order */
  order: number

  /** Episode sources */
  source: {
    /** 240p quality URL */
    q240: string | null

    /** 480p quality URL */
    q480: string | null

    /** 720p quality URL */
    q720: string | null

    /** 1080p (source) quality URL
     * @since 1.1.0 can not be null
     */
    q1080: string

    /** 1440p quality URL */
    q2k: string | null
  },

  /** Subs IDs
   * @deprecated not implemented
   */
  subIDs: string[] | null

  /** Episode preview frames URLs
   * Idk in what case it can be null, btw
   */
  framesURL: string[] | null
}

/** Title episode meta */
export interface ITitleEpisodeMeta {
  /** Episode order */
  order: number

  /** Episode translations */
  names: {
    /** Translated episode name on Ukranian */
    ukr: string

    /** Episode name on English (default) */
    eng: string
  }

  /** Espide aired timestamp */
  dateOut: number
}
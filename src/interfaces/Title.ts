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

export type TTitleCountry = 'Japan' | 'South Corea' | 'China' | 'Other'






/** Title object */
export interface ITitle {
  /** ID */
  id: string

  /** Object of names */
  names: {
    /** Name on English */
    eng: string

    /** Name on Ukranian */
    ukr: string

    /** Alt names (Japan, russian) */
    alt: string[] | null
  },

  /** Code (transformed eng name) */
  code: string

  /** Poster */
  poster: string

  /** Background
   * @deprecated due to zero impact
   */
  background: string

  /** Rating
   * @deprecated must be refactored into newRating
   */
  rating: number | null

  /** Rating
   * Inherited from rating
   * @version 1.1.2 will be refactored back to rating
   */
  newRating: {
    IMDB: number | null,
    Animee: number | null
  }

  /** Description */
  description: string

  /** Status */
  status: TAnimeStatus

  /** Estimated episodes
   * @deprecated will be refactored into episodesCount
   */
  estimatedEps: number

  /** Episodes count
   * Inherited from estimatedEps
   */
  episodesCount: number | null

  /** Genres
   * @version 1.1.1 can be null
   */
  genres: TAnimeGenre[] | null

  /** Age rating */
  ageRate: TAnimeAgeRate

  /** Streaming season */
  season: TAnimeSeason

  /** Type */
  type: TTitleType

  /** Aired year */
  year: number

  /** Studios created */
  studios: string[]

  /** Country produced
   * @deprecated refactor into newCountry
   */
  country: string

  /** Country produced
   * Inherited from country
   * @version 1.1.2 must be refactored back to country
   */
  newCountry: TTitleCountry

  /** Started timestamp
   * @deprecated useless
   */
  started: number | null

  /** Ended timestamp
    * @deprecated useless
    */
  ended: number | null

  /** Title dubs
   * @deprecated must be refactored into episodes
   */
  dubs: ITitleEpisodesDub[] | null

  /** Episodes dubbed */
  episodes: ITitleEpisode[] | null

  /** Episodes metas
   * @deprecated must be refactored into episodesMeta
   */
  epsMeta: ITitleEpisodeMeta[] | null

  /** Episodes metas
   * Inherited from epsMeta
   */
  episodesMeta: ITitleEpisodeMeta[] | null

  /** Updated at timestamp */
  updatedAt: number

  /** Some text details */
  details: string | null
}

/** Episode dubbed */
export interface ITitleEpisode {
  /** Dubber ID */
  dubberID: string

  /** Episode order */
  order: number

  /** Episode qualities */
  qualities: {
    /** Primary quality */
    q1080: string

    q4k: string | null
    q720: string | null
    q480: string | null
    q240: string | null
  }

  /** Frames in order array */
  frames: string[] | null
}

/** Title dub
 * @deprecated outdated
 * @see ITitle.episodes
 */
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

/** Title dubbed episode
 * @deprecated outdated
 * @see ITitle.episodes
 */
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
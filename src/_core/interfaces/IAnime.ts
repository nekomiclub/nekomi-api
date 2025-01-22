export interface ITitle {
  id: string
  poster: string
  description: string
  status: TAnimeStatus
  episodesCount: number | null
  genres: TAnimeGenre[]
  ageRate: TAnimeAgeRate
  season: TAnimeSeason
  type: TTitleType
  year: number
  studios: string[]
  country: TTitleCountry
  details: string | null
  updatedAt: number

  /** @since 1.3.2 */
  hikkaSyncedAt: number

  /** @private */
  episodes: ITitleEpisode[]

  /** @private */
  episodesMeta: ITitleEpisodeMeta[]

  /** Code (url encoded eng name) */
  code: string

  /** @since 1.3.2 */
  mal_id: string | null

  names: {
    eng: string
    ukr: string
    alt: string[]
  },

  rating: {
    IMDB: number | null
    /** @since 1.3.2 */
    mal: number | null
    /** MAL rated by
     * @since 1.3.2
     */
    mal_poll: number | null
    /** @deprecated 1.3.2 */
    Animee: number | null
  }
}

/** Episode dubbed */
export interface ITitleEpisode {
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

/** Title episode meta */
export interface ITitleEpisodeMeta {
  order: number
  names: {
    ukr: string
    eng: string
  }

  dateOut: number
}






/** Array of anime genres provided on nekomi.club */
export const AnimeGenres = ['chinese', '3D', 'shonen', 'shounenAi', 'seinen', 'shoujoAi', 'shoujo', 'comedy', 'romance', 'school', 'martial arts', 'vampires', 'military', 'harem', 'demons', 'detective', 'drama', 'games', 'historical', 'isekai', 'magic', 'mecha', 'music', 'parody', 'sliceOfLife', 'adventure', 'psychological', 'samurai', 'supernatural', 'sports', 'superpower', 'horror', 'sciFi', 'fantasy', 'action', 'ecchi', 'thriller', 'erotica', 'gourmet'] as const;
export type TAnimeGenre = typeof AnimeGenres[number];

/** Array of anime age ratings on nekomi.club
 * G - All Ages
 * PG - Children
 * PG-13 - Teens 13 or older
 * R17 - 17+ (violence & profanity)
 * R+ - Mild Nudity
 * Rx - Full nudity (not presented on nekomi.club, but?)
 */
export const AnimeAgeRates = ['G', 'PG', 'PG-13', 'R-17', 'R+', 'Rx'] as const;
export type TAnimeAgeRate = typeof AnimeAgeRates[number];

/** Array of anime statuses */
export const AnimeStatuses = ['announcement', 'ongoing', 'out', 'delayed'] as const;
export type TAnimeStatus = typeof AnimeStatuses[number]

/** Array of anime streaming seasons */
export const AnimeSeasons = ['summer', 'autumn', 'winter', 'spring'] as const;
export type TAnimeSeason = typeof AnimeSeasons[number]

/** Array of title types */
export const TitleTypes = ['serial', 'ONA', 'OVA', 'film', 'special'] as const;
export type TTitleType = typeof TitleTypes[number]

/** Array of title contries */
export const TitleCountries = ['Japan', 'South Corea', 'China', 'Other'] as const;
export type TTitleCountry = typeof TitleCountries[number]



export default ITitle;
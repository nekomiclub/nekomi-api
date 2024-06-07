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

/** Array of title contries */
export const TitleCountries = ['Japan', 'South Corea', 'China', 'Other'] as const;

/** Type that implements TitleCountries */
export type TTitleCountry = typeof TitleCountries[number]






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
    alt: string[]
  },

  /** Code (transformed eng name) */
  code: string

  /** Poster */
  poster: string

  /** Rating */
  rating: {
    IMDB: number | null,
    Animee: number | null
  }

  /** Description */
  description: string

  /** Status */
  status: TAnimeStatus

  /** Episodes count */
  episodesCount: number | null

  /** Genres */
  genres: TAnimeGenre[]

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

  /** Country produced */
  country: TTitleCountry

  /** Episodes dubbed */
  episodes: ITitleEpisode[]

  /** Episodes meta */
  episodesMeta: ITitleEpisodeMeta[]

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
  frames: string[]
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
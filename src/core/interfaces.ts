import { ITitleEpisodeMeta, ITitleEpisodesDub } from './ITitle';

export interface IStorageItem {
  id: string,
  URI: string,
  dateAdded: number
}

export type TAnimeGenres = 'chinese' | '3D' | 'shonen' | 'shounenAi' | 'seinen' | 'shoujoAi' | 'shoujo' | 'comedy' | 'romance' | 'school' | 'martial arts' | 'vampires' | 'military' | 'harem' | 'demons' | 'detective' | 'drama' | 'games' | 'historical' | 'isekai' | 'magic' | 'mecha' | 'music' | 'parody' | 'sliceOfLife' | 'adventure' | 'psychological' | 'samurai' | 'supernatural' | 'sports' | 'superpower' | 'horror' | 'sciFi' | 'fantasy' | 'action' | 'ecchi' | 'thriller' | 'erotica';
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
  type: 'serial' | 'ONA' | 'OVA' | 'film',
  year: number,
  studios: string[],
  country: string,
  started: number | null,
  ended: number | null,
  dubs: ITitleEpisodesDub[] | null,
  epsMeta: ITitleEpisodeMeta[] | null,
  linkedTitlesIDs: string[] | null,
  linkedManga: {
    id: string,
    pictureURL: string,
    name: string,
    URL: string
  } | null
}

export interface IDubber {
  id: string,
  code: string,
  name: string,
  thumbURL: string
}
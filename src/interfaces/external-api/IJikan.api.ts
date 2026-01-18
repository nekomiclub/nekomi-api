export interface IJikanAnime {
  mal_id: number;
  url: string;
  images: IJikanImages;
  trailer: IJikanTrailer;
  approved: boolean;
  titles: IJikanTitle[];
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  title_synonyms: string[];
  type: string;
  source: string;
  episodes: number;
  status: string;
  airing: boolean;
  aired: IJikanAired;
  duration: string;
  rating: string;
  score: number;
  scored_by: number;
  rank: number;
  popularity: number;
  members: number;
  favorites: number;
  synopsis: string | null;
  background: string | null;
  season: string | null;
  year: number | null;
  broadcast: IJikanBroadcast;
  producers: IJikanMalEntity[];
  licensors: IJikanMalEntity[];
  studios: IJikanMalEntity[];
  genres: IJikanMalEntity[];
  explicit_genres: IJikanMalEntity[];
  themes: IJikanMalEntity[];
  demographics: IJikanMalEntity[];
  relations: IJikanRelation[];
  theme: IJikanTheme;
  external: IJikanExternalLink[];
  streaming: IJikanExternalLink[];
}

/* ---------- Shared / Reusable Types ---------- */

export interface IJikanMalEntity {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface IJikanExternalLink {
  name: string;
  url: string;
}

/* ---------- Images ---------- */

export interface IJikanImages {
  jpg: IJikanImageSet;
  webp: IJikanImageSet;
}

export interface IJikanImageSet {
  image_url: string;
  small_image_url: string;
  large_image_url: string;
}

/* ---------- Trailer ---------- */

export interface IJikanTrailer {
  youtube_id: string | null;
  url: string | null;
  embed_url: string | null;
  images: IJikanTrailerImages;
}

export interface IJikanTrailerImages {
  image_url: string | null;
  small_image_url: string | null;
  medium_image_url: string | null;
  large_image_url: string | null;
  maximum_image_url: string | null;
}

/* ---------- Titles ---------- */

export interface IJikanTitle {
  type: string;
  title: string;
}

/* ---------- Airing Dates ---------- */

export interface IJikanAired {
  from: string | null;
  to: string | null;
  prop: {
    from: IJikanDateProp;
    to: IJikanDateProp;
  };
  string: string;
}

export interface IJikanDateProp {
  day: number | null;
  month: number | null;
  year: number | null;
}

/* ---------- Broadcast ---------- */

export interface IJikanBroadcast {
  day: string | null;
  time: string | null;
  timezone: string | null;
  string: string | null;
}

/* ---------- Relations ---------- */

export interface IJikanRelation {
  relation: string;
  entry: IJikanRelationEntry[];
}

export interface IJikanRelationEntry {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

/* ---------- Openings / Endings ---------- */

export interface IJikanTheme {
  openings: string[];
  endings: string[];
}


export interface IJikanAnimeEpisode {
  mal_id: number // order
  title: string
  aired: string | null // ISO
  score: number | null // 1 - 5
  filler: boolean
  recap: boolean
}
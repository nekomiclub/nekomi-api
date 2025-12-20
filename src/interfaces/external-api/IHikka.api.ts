import { ANIME_RATING, ANIME_SEASON, ANIME_STATUS, ANIME_TYPE } from '~/intf/IAnime';

export interface IHikkaAnime {
  data_type: 'anime';
  companies: IHikkaCompany[];
  genres: IHikkaGenre[];
  start_date: number;
  end_date: number | null;
  updated: number;
  comments_count: number;
  episodes_released: number | null;
  episodes_total: number | null;
  synopsis_en: string;
  synopsis_ua: string | null;
  media_type: 'tv' | string;
  title_ua: string | null;
  title_en: string;
  title_ja: string;
  duration: number | null;
  image: string;
  status: 'announced' | 'airing' | 'finished' | string;
  source: string;
  rating: string | null;
  has_franchise: boolean;
  native_scored_by: number;
  native_score: number;
  scored_by: number;
  score: number;
  nsfw: boolean;
  slug: string;
  season: 'winter' | 'spring' | 'summer' | 'fall' | string;
  year: number;
  synonyms: string[];
  external: IHikkaExternalLink[];
  videos: IHikkaVideo[];
  ost: IHikkaOST[];
  stats: IHikkaAnimeStats;
  schedule: IHikkaScheduleItem[];
  translated_ua: boolean;
  mal_id: number;
}

export interface IHikkaCompany {
  id?: number;
  name?: string;
}

export interface IHikkaGenre {
  name_ua: string
  name_en: string
  slug: string
  type: string
}

export interface IHikkaExternalLink {
  url: string;
  text: string;
  type: string;
}

export interface IHikkaVideo {
  url?: string;
  type?: string;
}

export interface IHikkaOST {
  index: number;
  title: string;
  author: string;
  spotify: string | null;
  ost_type: 'opening' | 'ending' | string;
}

export interface IHikkaAnimeStats {
  completed: number;
  watching: number;
  planned: number;
  dropped: number;
  on_hold: number;
  score_1: number;
  score_2: number;
  score_3: number;
  score_4: number;
  score_5: number;
  score_6: number;
  score_7: number;
  score_8: number;
  score_9: number;
  score_10: number;
}

export interface IHikkaScheduleItem {
  date: number;
  episode: number;
}
/** {@link https://api.hikka.io/docs#/Integrations/mal_anime_integrations_mal_anime__mal_id__get | docs} */

export interface IHikkaMALIntegration {
  data_type: string;
  media_type: ANIME_TYPE;
  title_ua: string;
  title_en: string;
  title_ja: string;
  episodes_released: number;
  episodes_total: number;
  image: string;
  status: ANIME_STATUS;
  scored_by: number;
  score: number;
  slug: string;
  start_date: number;
  end_date: number;
  translated_ua: boolean;
  season: ANIME_SEASON;
  source: string;
  rating: ANIME_RATING;
  year: number;
}

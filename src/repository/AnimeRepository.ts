import IAnime from '~/intf/IAnime';
import UnifiedRepository from './UnifiedRepository';
import mongoose, { Schema } from 'mongoose';
import { RepositoryQueriesType, RepositorySchemaType } from '~/intf/types';



/** Repository type. Reffers to the model interface */
type RepositoryType = IAnime;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ id: query }, { slug: query }] };
};



const schema: RepositorySchemaType<RepositoryType> = {
  id: String,
  created_at: String,
  episodes: Array,
  episodes_meta: Array,
  episodes_released: null,
  genres: Array,
  hero_poster: String,
  hero_poster_author: null,
  hikka_slug: null,
  hikka_sync: null,
  imdb_id: null,
  isDMCARestricted: Boolean,
  mal_id: null,
  myanimelist_sync: null,
  pictures: Array,
  posters: Array,
  rate: String,
  related: Array,
  schedule: Array,
  score: Number,
  scored_by: Number,
  season: String,
  slug: String,
  status: String,
  studios: Array,
  synopsis_en: String,
  synopsis_ua: null,
  title_en: String,
  title_ja: String,
  title_ua: null,
  title_synonims: Array,
  type: String,
  updated_at: String,
  year: Number,
  shikimori_sync: null
};

const model = mongoose.model<RepositoryType>('anime', new Schema(schema));



export class AnimeRepositoryClass extends UnifiedRepository<RepositoryType> {
  constructor(query?: string) {
    super(model, queries, query);
  }
}



const AnimeRepository = new AnimeRepositoryClass();

export default AnimeRepository;
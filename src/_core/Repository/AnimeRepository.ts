import IAnime from '~/core/Interfaces/IAnime';
import UnifiedRepository from './UnifiedRepository';
import mongoose, { Schema } from 'mongoose';
import { RepositoryQueriesType } from '~/core/Interfaces/types';



/** Repository type. Reffers to the model interface */
type RepositoryType = IAnime;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ uuid: query }, { slug: query }] };
};



const model = mongoose.model<RepositoryType>('anime', new Schema({
  uuid: String,
  broadcast: Object,
  description: String,
  details: String,
  episodes: Array,
  episodesCount: Number,
  episodesMeta: Array,
  malId: Number,
  malSyncedAt: Number,
  anidbSyncedAt: Number,
  createdAt: Number,
  hikkaSyncedAt: Number,
  shikimoriSyncedAt: Number,
  media: String,
  names: Object,
  pictures: Array,
  poster: String,
  rate: String,
  related: Array,
  score: Object,
  slug: String,
  updatedAt: Number,
  year: Number,
  studios: Array,
  status: String,
  season: String,
  genres: Array,
  posterAdapt: String,
  stopSync: Object,
  imdbId: String,
  isDMCARestricted: Boolean
}));



export class AnimeRepositoryClass extends UnifiedRepository<RepositoryType> {
  constructor(query?: string) {
    super(model, queries, query);
  }
}



const AnimeRepository = new AnimeRepositoryClass();

export default AnimeRepository;
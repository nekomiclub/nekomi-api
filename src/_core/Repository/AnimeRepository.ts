import IAnime from '~/core/Interfaces/IAnime';
import mongoose, { Schema } from 'mongoose';
import { IBasicRepository, RepositoryQueryType } from '~/core/Interfaces/types';



/** Repository type. Reffers to the model interface */
type RepositoryType = IAnime;



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



class AnimeRepository implements IBasicRepository<RepositoryType> {
  async getOne(query: string): Promise<RepositoryType> {
    const queries: RepositoryQueryType<RepositoryType>[] = [{ uuid: query }, { slug: query }];

    const result = await model.findOne(queries);
    if (!result) throw Error('INDEV_ERROR');

    return result;
  }

  async safeGetOne(query: string): Promise<RepositoryType | null> {
    const queries: RepositoryQueryType<RepositoryType>[] = [{ uuid: query }, { slug: query }];

    const result = await model.findOne(queries);

    return result;
  }

  async getMany(query: string): Promise<RepositoryType[]> {
    const queries: RepositoryQueryType<RepositoryType>[] = [{ uuid: query }, { slug: query }];

    const results = await model.find(queries);

    return results;
  }

  async getAll(): Promise<RepositoryType[]> {
    return await model.find();
  }

  async deleteOne(id: string): Promise<void> {
    await model.deleteOne({ uuid: id });
  }

  async deleteMany(id: string): Promise<void> {
    await model.deleteMany({ uuid: id });
  }
}



export default AnimeRepository;
import IAnime from '~/core/Interfaces/IAnime';
import mongoose, { Schema } from 'mongoose';
import { IBasicRepository } from '~/core/Interfaces/types';



const AnimeModel = mongoose.model<IAnime>('anime', new Schema({
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



class AnimeRepository implements IBasicRepository<IAnime> {
  async getOne(query: string): Promise<IAnime> {
    const queries = [{ uuid: query }, { slug: query }];

    const result = await AnimeModel.findOne(queries);
    if (!result) throw Error('INDEV_ERROR');

    return result;
  }

  async safeGetOne(query: string): Promise<IAnime | null> {
    const queries = [{ uuid: query }, { slug: query }];

    const result = await AnimeModel.findOne(queries);

    return result;
  }

  async getMany(query: string): Promise<IAnime[]> {
    const queries = [{ uuid: query }, { slug: query }];

    const results = await AnimeModel.find(queries);
    if (!results.length) throw Error('INDEV_ERROR');

    return results;
  }

  async deleteOne(id: string): Promise<void> {
    await AnimeModel.deleteOne({ uuid: id });
  }

  async deleteMany(id: string): Promise<void> {
    await AnimeModel.deleteMany({ uuid: id });
  }
}



export default AnimeRepository;
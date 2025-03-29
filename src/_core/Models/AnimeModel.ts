import Anime from '~/core/interfaces/AnimeIntf';
import mongoose, { Schema } from 'mongoose';



/** @private DO NOT USE IT ANYWHERE ELSE EXCEPT ANIME SERVICE */
export const AnimeModel = mongoose.model<Anime>('anime', new Schema({
  uuid: String,
  broadcast: Object,
  description: String,
  details: String,
  episodes: Array,
  episodesCount: Number,
  episodesMeta: Array,
  malId: Number,
  malSyncedAt: Number,
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
  stopSync: Object
}));



export default AnimeModel;
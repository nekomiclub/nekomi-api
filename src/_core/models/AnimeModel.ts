import Anime from '~/core/interfaces/Anime.intf';
import mongoose, { Schema } from 'mongoose';



const schema = new Schema({
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
});

schema.set('optimisticConcurrency', false);

/** @private DO NOT USE IT ANYWHERE ELSE EXCEPT ANIME SERVICE */
export const AnimeModel = mongoose.model<Anime>('anime', schema);



export default AnimeModel;
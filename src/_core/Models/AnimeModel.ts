import Anime from '../Interfaces/Anime.intf';
import mongoose, { Schema } from 'mongoose';



/** @private DO NOT USE IT ANYWHERE ELSE EXCEPT ANIME SERVICE */
export const AnimeModel = mongoose.model<Anime>('title', new Schema({
  uuid: String,
  broadcast: Object,
  description: String,
  details: String,
  episodes: Array,
  episodesCount: Number,
  episodesMeta: Array,
  genresNew: Array,
  malId: Number,
  malSyncedAt: Number,
  media: String,
  names: Object,
  pictures: Array,
  poster: String,
  rate: String,
  related: Array,
  score: Object,
  seasonNew: String,
  slug: String,
  statusNew: String,
  studiosNew: Array,
  updatedAt: Number,
  year: Number,
  type: String,
  studios: Array,
  status: String,
  season: String,
  rating: Object,
  mal_id: String,
  id: String,
  genres: Array,
  country: String,
  code: String,
  ageRate: String
}));



export default AnimeModel;
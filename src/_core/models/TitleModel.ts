import mongoose, { Schema } from 'mongoose';



/** @private DO NOT USE IT ANYWHERE ELSE EXCEPT ANIME SERVICE */
export const TitleModel = mongoose.model('title', new Schema({
  description: String,
  details: String,
  episodes: Array,
  episodesCount: Number,
  episodesMeta: Array,
  names: Object,
  poster: String,
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
  ageRate: String,
}));



export default TitleModel;
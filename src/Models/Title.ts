import mongoose, { Schema } from 'mongoose';
import { ITitle } from '../interfaces/Title';

export const Title = mongoose.model<ITitle>('title', new Schema({
  id: String,
  names: Object,
  code: String,
  poster: String,
  background: String,
  rating: Number || null,
  description: String,
  status: String,
  estimatedEps: Number,
  genres: Array<string>,
  ageRate: String,
  season: String,
  type: String,
  year: Number,
  studios: Array<string>,
  country: String,
  started: Number || null,
  ended: Number || null,
  dubs: Array || null,
  epsMeta: Array || null,
  updatedAt: Number,
  details: String || null
}));

export default Title; 
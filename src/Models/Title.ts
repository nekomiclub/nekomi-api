import mongoose, { Schema } from 'mongoose';
import { ITitle } from '../core/interfaces';

export const Title = mongoose.model<ITitle>('title', new Schema({
  id: String,
  names: {
    eng: String,
    ukr: String,
    alt: Array<string>
  },
  code: String,
  posterURL: String,
  backgroundURL: String,
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
  dubs: Array<{
    id: string,
    includeSub: boolean,
    include2K: boolean,
    eps: Array<{
      id: string,
      dubID: string,
      titleID: string,
      order: number,
      source: {
        q240: string,
        q480: string,
        q720: string,
        q1080: string,
        q2k: string | null
      },
      subIDs: Array<string> | null,
      framesURL: Array<string> | null
    }>
  }> || null,
  epsMeta: Array<{
    id: string,
    titleID: string,
    order: number,
    names: {
      ukr: string,
      eng: string
    },
    dateOut: number
  }> || null,
  linkedTitlesIDs: Array<string> || null,
  linkedManga: {
    id: String,
    pictureURL: String,
    name: String,
    URL: String
  } || null
}));

export default Title; 
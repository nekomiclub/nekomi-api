import mongoose, { Schema } from 'mongoose';
import { ITitle } from '../interfaces/Title';
import { createID, getUTC } from '../handlers/handlers';

export const Title = mongoose.model<ITitle>('title', new Schema({
  id: String,
  names: Object,
  code: String,
  poster: String,
  rating: Object,
  description: String,
  status: String,
  episodesCount: Number || null,
  genres: Array,
  ageRate: String,
  season: String,
  type: String,
  year: Number,
  studios: Array,
  country: String,
  episodes: Array,
  episodesMeta: Array,
  updatedAt: Number,
  details: String || null
}));

/** Create new title instance. Will set default fields
 * @returns ID
 */
export async function createTitle(): Promise<string> {
  const id = createID();

  const payload: ITitle = {
    id,
    ageRate: 'PG-13',
    code: `BLANK-${id}`,
    country: 'Other',
    description: '',
    details: 'Якщо ви помітили цей тайтл, будь ласка напишіть про це в тікети на діскорд сервері animee.',
    episodes: [],
    episodesMeta: [],
    episodesCount: null,
    genres: [],
    names: {
      eng: `BLANK-${id}`,
      ukr: `BLANK-${id}`,
      alt: []
    },
    poster: '',
    rating: {
      IMDB: null,
      Animee: null,
    },
    season: 'winter',
    status: 'out',
    studios: [],
    type: 'serial',
    updatedAt: getUTC().timestamp,
    year: getUTC().y,
  };

  const title = new Title(payload);
  await title.save();

  return id;
}

export default Title; 
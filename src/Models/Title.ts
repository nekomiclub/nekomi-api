import mongoose, { Schema } from 'mongoose';
import { ITitle } from '../interfaces/Title';
import { createID, getUTC } from '../handlers/v1/handlers';

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

/** Create new title instance. Will set default fields
 * @returns ID
 */
export async function createTitle(): Promise<string> {
  const id = createID();

  const payload: ITitle = {
    id,
    ageRate: 'PG-13',
    code: `BLANK-${id}`,
    country: 'null',
    description: '',
    details: 'Якщо ви помітили цей тайтл, будь ласка напишіть про це в тікети на діскорд сервері animee.',
    dubs: [],
    epsMeta: [],
    estimatedEps: 12,
    genres: [],
    names: {
      eng: `BLANK-${id}`,
      ukr: `BLANK-${id}`,
      alt: []
    },
    poster: '',
    rating: 0,
    season: 'winter',
    status: 'out',
    studios: [],
    type: 'serial',
    updatedAt: getUTC().timestamp,
    year: getUTC().y,
    started: 0,
    ended: 0,
    background: ''
  };

  const title = new Title(payload);
  await title.save();

  return id;
}

export default Title; 
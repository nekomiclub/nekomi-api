import mongoose, { Schema } from 'mongoose';
import { ITitle, ITitleEpisode, ITitleEpisodeMeta, TAnimeGenre } from '../interfaces/Title';
import { createID, getUTC } from '../handlers/handlers';
import { DeepPartial } from '../interfaces/Interfaces';
import { writeLog } from '../handlers/Errors';
import { convert } from 'url-slug';

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
export async function createTitle(creator: string, { ageRate, id, code, country, description, details, episodes, episodesCount, episodesMeta, genres, names, poster, rating, season, status, studios, type, year }: DeepPartial<ITitle>): Promise<string> {
  const ID = id || createID();
  const CODE = code ? code : names?.eng ? convert(names.eng!) : `BLANK-${id}`;

  const payload: ITitle = {
    id: ID,
    ageRate: ageRate || 'PG-13',
    code: CODE,
    country: country || 'Other',
    description: description || '',
    details: details || 'Якщо ви помітили цей тайтл, будь ласка напишіть про це в тікети на діскорд сервері animee.',
    episodes: (episodes as ITitleEpisode[]) || [],
    episodesMeta: (episodesMeta as ITitleEpisodeMeta[]) || [],
    episodesCount: episodesCount || null,
    genres: (genres as TAnimeGenre[]) || [],
    names: {
      eng: names?.eng || `BLANK-${id}`,
      ukr: names?.ukr || `BLANK-${id}`,
      alt: (names?.alt as string[] | undefined) || []
    },
    poster: poster || '',
    rating: {
      IMDB: rating?.IMDB || null,
      Animee: rating?.Animee || null,
    },
    season: season || 'winter',
    status: status || 'out',
    studios: (studios as string[] | undefined) || []
    ,
    type: type || 'serial',
    updatedAt: getUTC().timestamp,
    year: year || getUTC().y,
  };

  const title = new Title(payload);
  await title.save();

  writeLog(`info`, `New title (${id}) created by ${creator}`, `Title/createTitle`);

  return ID;
}

export default Title; 
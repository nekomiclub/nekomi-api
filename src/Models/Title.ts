import mongoose, { HydratedDocument, Schema } from 'mongoose';
import { convert as urlSlugConvert } from 'url-slug';

import { AnimeAgeRates, AnimeGenres, AnimeSeasons, AnimeStatuses, ITitle, ITitleEpisode, ITitleEpisodeMeta, TAnimeAgeRate, TAnimeGenre, TAnimeSeason, TAnimeStatus, TTitleCountry, TTitleType, TitleCountries, TitleTypes } from '../interfaces/Title';
import { createID, getUTC } from '../handlers/handlers';
import { DeepPartial } from '../interfaces/Interfaces';
import { E400, E404, E503, writeLog } from '../handlers/Errors';
import { IChangeEpMeta } from '../controllers/title';
import Dubbers from './Dubber';
import axios, { AxiosError } from 'axios';
import { singCSRFToken } from '../services/TokenService';
import { config, testMode } from '../config';
import * as cfg from '../config';
import { $http } from '../handlers/http';

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
  const CODE = code ? code : names?.eng ? urlSlugConvert(names.eng!, {
    camelCase: true,
    separator: '-'
  }) : `BLANK-${id}`;

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

  writeLog(`info`, `New title (${ID}) created by ${creator}`, `Title/createTitle`);

  return ID;
}



/** Title patching factory */
export class TitlePatcher {
  private title: HydratedDocument<ITitle>;
  private log: string[] = [];
  private testMode: boolean;

  constructor(title: HydratedDocument<ITitle>, { testMode }: { testMode?: boolean }) {
    this.title = title;
    this.testMode = testMode || cfg.testMode;
  }

  /** Get changes log */
  getLog(): string[] {
    return this.log;
  }

  /** Get hydrated title */
  getTitle(): HydratedDocument<ITitle> {
    return this.title;
  }

  /** Save document */
  async save() {
    await this.title.save();
  }

  /** Change ukr, alt & eng names.
   * Changing eng name will also change code
   * Max length: 320
   * Max alt names: 20
   */
  changeNames({ alt, eng, ukr }: { eng?: string, ukr?: string, alt?: string[] }) {
    const label = '[ChangeNames]:';
    const MAX_LENGTH = 320;
    const MAX_ALTS = 20;

    this.title.markModified('names');

    if (ukr) {
      const trimmed = ukr.trim().replace(/\s+/g, ' ');

      if (trimmed.length > MAX_LENGTH) throw new E400(`${label} Ukranian name can not be greater than ${MAX_LENGTH} symbols`);

      this.log.push(`${label} Changed ukranian name - ${this.title.names.ukr} > ${trimmed}`);

      this.title.names.ukr = trimmed;
    }

    if (eng) {
      const trimmed = eng.trim().replace(/\s+/g, ' ');
      const code = urlSlugConvert(trimmed, {
        camelCase: true,
        separator: '-'
      });

      if (trimmed.length > MAX_LENGTH) throw new E400(`${label} English name can not be greater than ${MAX_LENGTH} symbols`);

      this.log.push(`${label} Changed english name - ${this.title.names.eng} > ${trimmed}`);
      this.log.push(`${label} Changed code - ${this.title.code} > ${code}`);
      this.title.markModified('code');

      this.title.names.eng = trimmed;
      this.title.code = code;
    }

    if (alt) {
      const trimmedArr: string[] = [];

      if (alt.length > MAX_ALTS) throw new E400(`${label} Alt names can not be more than ${MAX_ALTS}`);

      alt.forEach(name => {
        const trimmed = name.trim().replace(/\s+/g, ' ');

        if (trimmed.length > MAX_LENGTH) throw new E400(`${label} Alt name can not be greater than ${MAX_LENGTH} symbols`);

        trimmedArr.push(trimmed);
      });

      this.log.push(`${label} Changed alt names - ${this.title.names.alt.join(', ')} > ${trimmedArr.join(', ')}`);

      this.title.names.alt = trimmedArr;
    }
  }

  /** Change age rate */
  changeAgeRate(ageRate: TAnimeAgeRate) {
    const label = '[ChangeAgeRate]:';

    if (!AnimeAgeRates.includes(ageRate)) throw new E400(`${label} Age rate (${ageRate}) is invalid`);

    this.log.push(`${label} Changed age rate - ${this.title.ageRate} > ${ageRate}`);
    this.title.markModified('ageRate');

    this.title.ageRate = ageRate;
  }

  /** Change country */
  changeCountry(country: TTitleCountry) {
    const label = '[ChangeCountry]:';

    if (!TitleCountries.includes(country)) throw new E400(`${label} Country (${country}) is invalid`);

    this.log.push(`${label} Changed country - ${this.title.country} > ${country}`);
    this.title.markModified('country');

    this.title.country = country;
  }

  /** Change description
   * Max length: 2200
   */
  changeDescription(description: string) {
    const label = '[ChangeDescription]:';
    const trimmed = description.trim().replace(/\s+/g, ' ');
    const MAX_LENGTH = 2200;

    if (trimmed.length > MAX_LENGTH) throw new E400(`${label} Description can not be greater than ${MAX_LENGTH} symbols`);

    this.log.push(`${label} Changed description - ${this.title.description.length} symbols > ${trimmed.length} symbols`);
    this.title.markModified('description');

    this.title.description = trimmed;
  }

  /** Change details
   * If details length equals 0, will set null
   * Max length: 500
   */
  changeDetails(details: string | null) {
    const label = '[ChangeDetails]:';
    const MAX_LENGTH = 500;

    if (details === null || details.length === 0) {
      this.log.push(`${label} Changed details - ${this.title.details?.length || 0} symbols > null`);

      this.title.details = null;
    } else {
      const trimmed = details.trim().replace(/\s+/g, ' ');

      if (trimmed.length > MAX_LENGTH) throw new E400(`${label} Details can not be greater than ${MAX_LENGTH} symbols`);

      this.log.push(`${label} Changed details - ${this.title.details?.length || 0} symbols > ${trimmed.length} symbols`);

      this.title.details = trimmed;
    }

    this.title.markModified('details');
  }

  /** Change episodes count
   * If count equals 0, will set null
   * Min count: 1
   * Max count: 9999
   */
  changeEpisodesCount(count: number | null) {
    const label = '[ChangeEpisodesCount]:';
    const MIN_VAL = 1;
    const MAX_VAL = 9999;

    if (count === null || count === 0) {
      this.log.push(`${label} Changed episodes count - ${this.title.episodesCount} > null`);

      this.title.episodesCount = null;
    } else {
      if (count < MIN_VAL || count > MAX_VAL) throw new E400(`${label} Episodes count can not be less than ${MIN_VAL} or greater than ${MAX_VAL}`);

      this.log.push(`${label} Changed episodes count - ${this.title.episodesCount} > ${count}`);

      this.title.episodesCount = count;
    }

    this.title.markModified('episodesCount');
  }

  /** Change genres
   * Max count: 10
   */
  changeGenres(genres: TAnimeGenre[]) {
    const label = '[ChangeGenres]:';
    const MAX_LENGTH = 10;

    if (genres.length > MAX_LENGTH) throw new E400(`Genres can not be more than ${MAX_LENGTH}`);

    genres.forEach(genre => {
      if (!AnimeGenres.includes(genre)) throw new E400(`${label} Genre (${genre}) is invalid`);
    });

    this.log.push(`${label} Changed genres - ${this.title.genres.join(', ')} > ${genres.join(', ')}`);

    this.title.genres = genres;

    this.title.markModified('genres');
  }

  /** Change rating
   * If rating equals 0, will set null
   * Min rating: 1
   * Max rating: 10
   */
  changeRating(rating: number | null, type: 'IMDB' | 'Animee') {
    const label = '[ChangeRating]:';

    if (rating === null || rating === 0) {
      this.log.push(`${label} ${type} rating changed - ${this.title.rating[type]} > null`);

      this.title.rating[type] = null;
    } else {
      if (rating < 1 || rating > 10) throw new E400(`${label} ${type} rating can not be less than 1 or greater than 10`);

      this.log.push(`${label} ${type} rating changed - ${this.title.rating[type]} > ${rating}`);

      this.title.rating[type] = rating;
    }

    this.title.markModified('rating');
  }

  /** Change season */
  changeSeason(season: TAnimeSeason) {
    const label = '[ChangeSeason]:';

    if (!AnimeSeasons.includes(season)) throw new E400(`${label} Season (${season}) is invalid`);

    this.log.push(`${label} Changed season - ${this.title.season} > ${season}`);
    this.title.markModified('season');

    this.title.season = season;
  }

  /** Change status */
  changeStatus(status: TAnimeStatus) {
    const label = '[ChangeStatus]:';

    if (!AnimeStatuses.includes(status)) throw new E400(`${label} Status (${status}) is invalid`);

    this.log.push(`${label} Changed status - ${this.title.status} > ${status}`);
    this.title.markModified('status');

    this.title.status = status;
  }

  /** Change type */
  changeType(type: TTitleType) {
    const label = '[ChangeType]:';

    if (!TitleTypes.includes(type)) throw new E400(`${label} Type (${type}) is invalid`);

    this.log.push(`${label} Changed type - ${this.title.type} > ${type}`);
    this.title.markModified('type');

    this.title.type = type;
  }

  /** Change year
   * Min year: 2000
   * Max year: 2030
   */
  changeYear(year: number) {
    const label = '[ChangeYear]:';
    const MIN_YEAR = 2000;
    const MAX_YEAR = 2030;

    if (year < MIN_YEAR || year > MAX_YEAR) throw new E400(`${label} Year can not be less than ${MIN_YEAR} or greater than ${MAX_YEAR}`);

    this.log.push(`${label} Changed year - ${this.title.year} > ${year}`);
    this.title.markModified('year');

    this.title.year = year;
  }

  /** Change studios
   * Max count: 5
   * Max length: 24
   */
  changeStudios(studios: string[]) {
    const label = '[ChangeStudios]:';
    const trimmedArr: string[] = [];
    const MAX_LENGTH = 24;

    if (studios.length > 5) throw new E400(`${label} Studios can not be more than 5`);

    studios.forEach(studio => {
      const trimmed = studio.trim().replace(/\s+/g, ' ');

      if (trimmed.length > MAX_LENGTH) throw new E400(`${label} Studio name can not be greater than ${MAX_LENGTH} symbols`);

      trimmedArr.push(trimmed);
    });

    this.log.push(`${label} Changed studios - ${this.title.studios.join(', ')} > ${trimmedArr.join(', ')}`);
    this.title.markModified('studios');

    this.title.studios = trimmedArr;
  }

  /** Change episode meta
   * Min order: 1
   * Max order: 9999
   */
  changeEpisodeMeta({ action, dateOut, names, order }: IChangeEpMeta) {
    const label = '[ChangeEpisodeMeta]:';

    this.title.markModified('episodesMeta');

    const ep = this.title.episodesMeta.find(el => el.order === order);

    if (action === 'edit') {
      if (!ep) {
        this.log.push(`${label} Meta for #${order} episode added`);

        if (dateOut < 0) throw new E400(`${label} DateOut can not be less than 0`);
        if (order < 1 || order > 9999) throw new E400(`${label} Order can not be less than 1 or greater than 9999`);

        this.title.episodesMeta.push({
          dateOut,
          names: {
            eng: names.eng.trim().replace(/\s+/g, ' '),
            ukr: names.ukr.trim().replace(/\s+/g, ' ')
          },
          order
        });

        return;
      }

      this.log.push(`${label} Meta for #${order} episode edited`);

      ep.dateOut = dateOut;
      ep.names = {
        eng: names.eng.trim().replace(/\s+/g, ' '),
        ukr: names.ukr.trim().replace(/\s+/g, ' ')
      };
    } else if (action === 'delete') {
      if (!ep) throw new E404(`${label} Meta for #${order} episode is not found`);

      this.log.push(`${label} Meta for #${order} episode deleted`);

      this.title.episodesMeta = this.title.episodesMeta.filter(el => !(el.order === order));
    } else {
      throw new E400(`${label} Action (${action}) is invalid`);
    }
  }

  /** Delete episode
   * Will save document after deleting episode
   * @param by Episode deleted by user ID
   */
  async deleteEpisode(by: string, { dubID, order }: { order: number, dubID: string }) {
    const label = '[DeleteEpisode]:';
    const ep = this.title.episodes.find(el => el.order === order && el.dubberID === dubID);

    if (!ep) throw new E404(`${label} Episode (${order} in ${dubID}) is not found`);

    try {
      if (!this.testMode) {
        await $http.delete(`${config.URL.uploads}/upload/${ep.qualities.q1080.split('/')[ep.qualities.q1080.split('/').length - 1]}?by=${by}&withChildren=true`, {
          validateStatus(status) {
            return status < 500;
          },
        });
      }

      writeLog('warn', `Episode (${order} in ${dubID}) for ${this.title.id} deleted by ${by}`, `Title/TitlePatcher/deleteEpisode`);
    } catch (e) {
      if (e instanceof AxiosError) {
        if (e.code === 'ECONNREFUSED') {
          throw new E503('Animee-uploads is not available. Try in a few minutes');
        }

        throw e;
      } else {
        throw e;
      }
    }

    this.log.push(`${label} Episode (${order} in ${dubID}) deleted.`);
    this.title.markModified('episodes');

    this.title.episodes = this.title.episodes.filter(el => !(el.order === order && el.dubberID === dubID));

    try {
      if (!this.testMode) await this.save();
    } catch (e) {
      // ignore
    }
  }
}

export default Title; 
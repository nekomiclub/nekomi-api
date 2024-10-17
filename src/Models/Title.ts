import mongoose, { HydratedDocument, Schema } from 'mongoose';
import { convert as urlSlugConvert } from 'url-slug';

import { AnimeAgeRates, AnimeGenres, AnimeSeasons, AnimeStatuses, ITitle, ITitleEpisode, ITitleEpisodeMeta, TAnimeAgeRate, TAnimeGenre, TAnimeSeason, TAnimeStatus, TTitleCountry, TTitleType, TitleCountries, TitleTypes } from '../interfaces/Title';
import { getUTC, parseIMDBDate, parseRoles } from '../handlers/handlers';
import { DeepPartial } from '../interfaces/Interfaces';
import { IChangeEpMeta } from '../controllers/title';
import Dubber from './Dubber';
import axios, { AxiosError } from 'axios';
import { singCSRFToken } from '../services/TokenService';
import { config, RULES } from '../config';
import * as cfg from '../config';
import { $http, $upload } from '../handlers/http';
import puppeteer from 'puppeteer';
import { E404, E500, E503, ERR_ACCESS_REJECTED, ERR_ALREADY_EXIST, ERR_INVALID_PAYLOAD, ERR_LENGTH_INVALID, ERR_TYPE_INVALID } from '../services/ErrorService';
import { Logger } from '../services/LoggerService';
import { createID, getNewUTC } from '../handlers/handler';
import validator, { trim } from 'validator';
import UserModel from './User';
import { IUser } from '../interfaces/User';
import { Multer } from 'multer';
import { IDubber } from '../interfaces/Dubber';
import { TEpisodeQuality } from '../interfaces/Services';
import { INotifyAiringStarted, INotifyNewEpisode } from '../interfaces/Notify';
import { Notify } from '../services/NotifyService';



interface ITitleServiceProps {
  title: HydratedDocument<ITitle>
  testMode?: boolean
}

interface ITitleCreate {
  /** Id can be set only in dev mode */
  id?: string

  names?: {
    eng?: string
    ukr?: string
    alt?: string[]
  }
  ageRate?: TAnimeAgeRate
  country?: TTitleCountry
  description?: string
  details?: string
  genres?: TAnimeGenre[]
  season?: TAnimeSeason
  status?: TAnimeStatus
  studios?: string[]
  type?: TTitleType
  year?: number
  episodesCount?: number
}

interface IPatchNames {
  eng?: string
  ukr?: string
  alt?: string[]
}

interface IDeleteEpisode {
  order: number
  dubber: HydratedDocument<IDubber>
  user: HydratedDocument<IUser>
}

interface IUploadEpisode {
  file: Express.Multer.File
  user: HydratedDocument<IUser>,
  dubber: HydratedDocument<IDubber>
  episodeOrder: number
  qualities: TEpisodeQuality[]
}

interface IUploadPoster {
  file: Express.Multer.File
  user: HydratedDocument<IUser>
}

export interface IM_TitleSerciveUploadEpisode {
  /** Upload ID */
  id: string

  /** Video frames count */
  frames: number
}

export interface IM_TitleServiceUploadPoster {
  /** Upload ID */
  id: string
}



/** To create/patch/delete Title instance use TitleService */
export const TitleModel = mongoose.model<ITitle>('title', new Schema({
  id: String,
  names: Object,
  code: String,
  poster: String,
  rating: Object,
  description: String,
  status: String,
  episodesCount: Number,
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
  details: String
}));

/** Create new title instance. Will set default fields
 * @returns ID
 * @deprecated
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

  const title = new TitleModel(payload);
  await title.save();

  Logger.debug(`[TitleController]: New title created by - ${creator} with id - ${id}`);

  return ID;
}



/** Title patching factory
 * @deprecated
 */
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
    const prev = this.title.updatedAt;
    this.title.updatedAt = getUTC().timestamp;
    this.title.markModified('updatedAt');

    console.log(`change updated at - ${prev} > ${this.title.updatedAt}`);

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

      if (trimmed.length > MAX_LENGTH) throw new ERR_LENGTH_INVALID(`${label} Ukranian name can not be greater than ${MAX_LENGTH} symbols`);

      this.log.push(`${label} Changed ukranian name - ${this.title.names.ukr} > ${trimmed}`);

      this.title.names.ukr = trimmed;
    }

    if (eng) {
      const trimmed = eng.trim().replace(/\s+/g, ' ');
      const code = urlSlugConvert(trimmed, {
        camelCase: true,
        separator: '-'
      });

      if (trimmed.length > MAX_LENGTH) throw new ERR_LENGTH_INVALID(`${label} English name can not be greater than ${MAX_LENGTH} symbols`);

      this.log.push(`${label} Changed english name - ${this.title.names.eng} > ${trimmed}`);
      this.log.push(`${label} Changed code - ${this.title.code} > ${code}`);
      this.title.markModified('code');

      this.title.names.eng = trimmed;
      this.title.code = code;
    }

    if (alt) {
      const trimmedArr: string[] = [];

      if (alt.length > MAX_ALTS) throw new ERR_LENGTH_INVALID(`${label} Alt names can not be more than ${MAX_ALTS}`);

      alt.forEach(name => {
        const trimmed = name.trim().replace(/\s+/g, ' ');

        if (trimmed.length > MAX_LENGTH) throw new ERR_LENGTH_INVALID(`${label} Alt name can not be greater than ${MAX_LENGTH} symbols`);

        trimmedArr.push(trimmed);
      });

      this.log.push(`${label} Changed alt names - ${this.title.names.alt.join(', ')} > ${trimmedArr.join(', ')}`);

      this.title.names.alt = trimmedArr;
    }
  }

  /** Change age rate */
  changeAgeRate(ageRate: TAnimeAgeRate) {
    const label = '[ChangeAgeRate]:';

    if (!AnimeAgeRates.includes(ageRate)) throw new ERR_INVALID_PAYLOAD(`${label} Age rate (${ageRate}) is invalid`);

    this.log.push(`${label} Changed age rate - ${this.title.ageRate} > ${ageRate}`);
    this.title.markModified('ageRate');

    this.title.ageRate = ageRate;
  }

  /** Change country */
  changeCountry(country: TTitleCountry) {
    const label = '[ChangeCountry]:';

    if (!TitleCountries.includes(country)) throw new ERR_INVALID_PAYLOAD(`${label} Country (${country}) is invalid`);

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

    if (trimmed.length > MAX_LENGTH) throw new ERR_LENGTH_INVALID(`${label} Description can not be greater than ${MAX_LENGTH} symbols`);

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

      if (trimmed.length > MAX_LENGTH) throw new ERR_LENGTH_INVALID(`${label} Details can not be greater than ${MAX_LENGTH} symbols`);

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
      if (count < MIN_VAL || count > MAX_VAL) throw new ERR_LENGTH_INVALID(`${label} Episodes count can not be less than ${MIN_VAL} or greater than ${MAX_VAL}`);

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

    if (genres.length > MAX_LENGTH) throw new ERR_LENGTH_INVALID(`Genres can not be more than ${MAX_LENGTH}`);

    genres.forEach(genre => {
      if (!AnimeGenres.includes(genre)) throw new ERR_INVALID_PAYLOAD(`${label} Genre (${genre}) is invalid`);
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
      if (rating < 1 || rating > 10) throw new ERR_INVALID_PAYLOAD(`${label} ${type} rating can not be less than 1 or greater than 10`);

      this.log.push(`${label} ${type} rating changed - ${this.title.rating[type]} > ${rating}`);

      this.title.rating[type] = rating;
    }

    this.title.markModified('rating');
  }

  /** Change season */
  changeSeason(season: TAnimeSeason) {
    const label = '[ChangeSeason]:';

    if (!AnimeSeasons.includes(season)) throw new ERR_INVALID_PAYLOAD(`${label} Season (${season}) is invalid`);

    this.log.push(`${label} Changed season - ${this.title.season} > ${season}`);
    this.title.markModified('season');

    this.title.season = season;
  }

  /** Change status */
  changeStatus(status: TAnimeStatus) {
    const label = '[ChangeStatus]:';

    if (!AnimeStatuses.includes(status)) throw new ERR_INVALID_PAYLOAD(`${label} Status (${status}) is invalid`);

    this.log.push(`${label} Changed status - ${this.title.status} > ${status}`);
    this.title.markModified('status');

    this.title.status = status;
  }

  /** Change type */
  changeType(type: TTitleType) {
    const label = '[ChangeType]:';

    if (!TitleTypes.includes(type)) throw new ERR_INVALID_PAYLOAD(`${label} Type (${type}) is invalid`);

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

    if (year < MIN_YEAR || year > MAX_YEAR) throw new ERR_LENGTH_INVALID(`${label} Year can not be less than ${MIN_YEAR} or greater than ${MAX_YEAR}`);

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

    if (studios.length > 5) throw new ERR_LENGTH_INVALID(`${label} Studios can not be more than 5`);

    studios.forEach(studio => {
      const trimmed = studio.trim().replace(/\s+/g, ' ');

      if (trimmed.length > MAX_LENGTH) throw new ERR_LENGTH_INVALID(`${label} Studio name can not be greater than ${MAX_LENGTH} symbols`);

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

        if (dateOut < 0) throw new ERR_LENGTH_INVALID(`${label} DateOut can not be less than 0`);
        if (order < 1 || order > 9999) throw new ERR_LENGTH_INVALID(`${label} Order can not be less than 1 or greater than 9999`);

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
      throw new ERR_INVALID_PAYLOAD(`${label} Action (${action}) is invalid`);
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

      Logger.debug(`[TitleController]: Episode ${order}/${dubID} in ${this.title.id} deleted by ${by}`);
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

  /** Parse IMDB episodes meta */
  async parseIMDBEpisodesMeta(link: string) {
    const label = `[ParseIMDBEpisodesMeta]:`;
    let url = new URL('https://example.com');

    try {
      url = new URL(link);
    } catch (e) {
      throw new ERR_INVALID_PAYLOAD('URL parsing error');
    }

    if (url.host === 'example.com') throw new ERR_INVALID_PAYLOAD('URL parsing error');
    if (url.host !== 'www.imdb.com' && url.host !== 'imdb.com') throw new ERR_INVALID_PAYLOAD('Host is not IMDB');
    if (!url.pathname.includes('/title') || !url.pathname.includes('/episodes')) throw new ERR_INVALID_PAYLOAD('Pathname is not including /title or /episodes');

    const href = `${url.origin}${url.pathname}`;
    const results: ITitleEpisodeMeta[] = [];

    const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');

    // Navigate & wait for loading
    await page.goto(href);
    await page.waitForSelector('#home_img');

    // Parse
    const data = await page.$$eval('.ipc-page-section', el => {
      const cfg = {
        titleClass: '.ipc-title__text',
        dateoutClass: '.sc-ccd6e31b-10',
        cardClass: '.sc-ccd6e31b-4'
      };

      const cards = el[2].querySelectorAll(cfg.cardClass);
      let tmp: ITitleEpisodeMeta[] = [];

      cards.forEach((card: any, i: number) => {
        const title = card.querySelector(cfg.titleClass).innerText.split('∙ ')[1] as string;
        i++;

        tmp.push({
          names: {
            eng: title,
            ukr: title.includes('Episode') ? `${i} епізод` : '~~~'
          },
          order: i,
          dateOut: card.querySelector(cfg.dateoutClass).innerText
        });
      });

      return tmp;
    });

    await browser.close();

    data.forEach(el => {
      results.push({
        dateOut: parseIMDBDate(`${el.dateOut}`),
        names: el.names,
        order: +el.order
      });
    });

    let newEpisodes = 0;

    results.forEach(meta => {
      if (!this.title.episodesMeta.some(el => el.order === meta.order)) {
        this.title.episodesMeta.push(meta);
        newEpisodes += 1;
      }
    });

    this.title.episodesMeta = this.title.episodesMeta.sort((a, b) => a.order - b.order);
    this.save();
  }
}

/** Create/path/delete User instance */
export class TitleService {
  readonly title: HydratedDocument<ITitle>;
  readonly stack: string[] = [];
  readonly testMode = cfg.testMode;

  constructor({ title, testMode }: ITitleServiceProps) {
    this.title = title;

    if (testMode) this.testMode = testMode;
  }

  static async create({ names, ageRate, country, description, details, genres, season, status, studios, type, year, episodesCount, id }: ITitleCreate, testMode?: boolean): Promise<HydratedDocument<ITitle>> {
    const ID = testMode ? id || createID() : createID();
    let code = urlSlugConvert(names?.eng || `Untitled ${id}`, {
      camelCase: true,
      separator: '-'
    });

    // Replace code with id if it exist
    const titleExist = await TitleModel.findOne({ code });
    if (titleExist) code = urlSlugConvert(`Untitled ${id}`, {
      camelCase: true,
      separator: '-'
    });



    const payload: ITitle = {
      id: ID,
      code,
      names: {
        ukr: names?.ukr || `Тайтл без назви ${id}`,
        eng: names?.eng || `Untitled ${id}`,
        alt: names?.alt || []
      },
      ageRate: ageRate || 'PG-13',
      country: country || 'Other',
      description: description || 'Це новий тайтл на animee.club :)',
      details: details || 'Якщо ви помітили цей тайтл, будь ласка напишіть про це в тікети на діскорд сервері animee.',
      episodes: [],
      episodesCount: episodesCount || null,
      episodesMeta: [],
      genres: genres || [],
      poster: config.vars.defaultPoster,
      rating: {
        Animee: null,
        IMDB: null
      },
      season: season || 'winter',
      status: status || 'announcement',
      studios: studios || ['Fullkekw'],
      type: type || 'serial',
      updatedAt: getNewUTC().timestamp,
      year: year || getNewUTC().year
    };

    const title = new TitleModel(payload);
    // await title.save();

    return title;
  }

  static async delete(id: string, reason?: string, count?: 'one' | 'many') {
    if (count === undefined || count === 'one') {
      await TitleModel.deleteOne({ id });
    } else if (count === 'many') {
      await TitleModel.deleteMany({ id });
    }

    Logger.debug(`[TitleService]: Deleted title with id ${id}. Reason - ${reason || 'Not provided'}`);
  }

  /** Save document
   * @returns current patch stack
   */
  async save(): Promise<string[]> {
    await this.title.save();

    Logger.debug(`[TitleService]: Title ${this.title.id} patched! Stack - ${this.stack.length ? this.stack.join('; ') : 'Nothing patched...'}`);

    return this.stack;
  }

  //* --------- Patch
  /** Patch title names
   * Changing eng name will also change title code
   */
  async patchNames({ alt, eng, ukr }: IPatchNames) {
    this.title.markModified('names');

    if (ukr !== undefined) {
      const trimmed = ukr.trim().replace(/\s+/g, ' ');
      if (!validator.isLength(trimmed, { min: RULES.PatchTitle.minNameLength, max: RULES.PatchTitle.maxNameLength })) throw new ERR_LENGTH_INVALID(`Name must be between ${RULES.PatchTitle.minNameLength} and ${RULES.PatchTitle.maxNameLength} symbols length`);

      this.stack.push(`Changed Ukranian name (${this.title.names.ukr} > ${trimmed})`);
      this.title.names.ukr = trimmed;
    }

    if (eng !== undefined) {
      const trimmed = eng.trim().replace(/\s+/g, ' ');
      if (!validator.isLength(trimmed, { min: RULES.PatchTitle.minNameLength, max: RULES.PatchTitle.maxNameLength })) throw new ERR_LENGTH_INVALID(`Name must be between ${RULES.PatchTitle.minNameLength} and ${RULES.PatchTitle.maxNameLength} symbols length`);

      const code = urlSlugConvert(trimmed, {
        camelCase: true,
        separator: '-'
      });

      const exist = await TitleModel.findOne({ code });
      if (exist) throw new ERR_ALREADY_EXIST(`Title with code ${code} is already exist`);

      this.title.markModified('code');

      this.stack.push(`Changed English name (${this.title.names.eng} > ${trimmed})`);
      this.title.names.eng = trimmed;

      this.stack.push(`Changed code (${this.title.code} > ${code})`);
      this.title.code = code;
    }

    if (alt !== undefined) {
      if (!alt.length) return this.title.names.alt = alt;

      const newAlt: string[] = [];

      alt.forEach(name => {
        const trimmed = name.trim().replace(/\s+/g, ' ');
        if (!validator.isLength(trimmed, { min: RULES.PatchTitle.minNameLength, max: RULES.PatchTitle.maxNameLength })) throw new ERR_LENGTH_INVALID(`Name must be between ${RULES.PatchTitle.minNameLength} and ${RULES.PatchTitle.maxNameLength} symbols length`);

        newAlt.push(trimmed);
      });

      if (newAlt.length > RULES.PatchTitle.maxAltNamesCount) throw new ERR_LENGTH_INVALID(`Alt names can not be more than ${RULES.PatchTitle.maxAltNamesCount}`);

      this.stack.push(`Changed alternative names (${this.title.names.alt.join(', ')} > ${newAlt.join(', ')})`);
      this.title.names.alt = newAlt;
    }
  }

  async patchDescription(description: string) {
    const trimmed = description.trim().replace(/\s+/g, ' ');
    if (!validator.isLength(trimmed, { max: RULES.PatchTitle.maxDescriptionLength })) throw new ERR_LENGTH_INVALID(`Description must be shorter than ${RULES.PatchTitle.maxDescriptionLength} symbols length`);

    this.stack.push(`Changed description (${this.title.description.length} symbols > ${trimmed.length} symbols)`);
    this.title.markModified('description');

    this.title.description = trimmed;
  }

  /** Patch title details
   * If details length equals 0 or null, will set null
   */
  async patchDetails(details: string | null) {
    if (details === null || details.length === 0) {
      this.title.markModified('details');
      this.stack.push(`Changed details (${Number(this.title.details?.length)} symbols > null)`);

      this.title.details = null;

      return;
    }

    const trimmed = details.trim().replace(/\s+/g, ' ');
    if (!validator.isLength(trimmed, { max: RULES.PatchTitle.maxDetailsLength })) throw new ERR_LENGTH_INVALID(`Details must be shorter than ${RULES.PatchTitle.maxDetailsLength} symbols length`);

    this.stack.push(`Changed details (${Number(this.title.details?.length)} symbols > ${trimmed.length} symbols)`);

    this.title.details = trimmed;
  }

  /** Patch episodes count
   * If count is 0 or null, will set null
   */
  async patchEpisodesCount(count: number | null) {
    if (count === null || count === 0) {
      this.title.markModified('episodesCount');

      this.stack.push(`Changed episodes count (${this.title.episodesCount} > null)`);
      this.title.episodesCount = null;

      return;
    }

    if (count > RULES.PatchTitle.maxEpisode || count < RULES.PatchTitle.minEpisode) throw new ERR_LENGTH_INVALID(`Episodes count must be between ${RULES.PatchTitle.minEpisode} and ${RULES.PatchTitle.maxEpisode}`);

    this.title.markModified('episodesCount');

    this.stack.push(`Changed episodes count (${this.title.episodesCount} > ${count})`);
    this.title.episodesCount = count;
  }

  async patchGenres(genres: TAnimeGenre[]) {
    if (genres.length > RULES.PatchTitle.maxGenresCount) throw new ERR_LENGTH_INVALID(`Genres can not be more than ${RULES.PatchTitle.maxGenresCount}`);

    genres.forEach(genre => {
      if (!AnimeGenres.includes(genre)) throw new ERR_TYPE_INVALID(`Genre ${genre} is invalid`);
    });

    this.title.markModified('genres');

    this.stack.push(`Changed genres (${this.title.genres.join(', ')} > ${genres.join(', ')})`);
    this.title.genres = genres;
  }

  /** Patch IMDb or Animee rating
   * If rating is 0 or null, will set null
   */
  async patchRating(rating: number | null, type: 'IMDB' | 'Animee') {
    if (rating === null || rating === 0) {
      this.stack.push(`Changed ${type} rating( ${this.title.rating[type]} > null)`);

      this.title.rating[type] = null;
    } else {
      if (rating < RULES.PatchTitle.minRating || rating > RULES.PatchTitle.maxRating) throw new ERR_LENGTH_INVALID(`${type} rating must be between ${RULES.PatchTitle.minRating} and ${RULES.PatchTitle.maxRating}`);

      this.stack.push(`Changed ${type} rating (${this.title.rating[type]} > ${rating})`);

      this.title.rating[type] = rating;
    }

    this.title.markModified('rating');
  }

  async patchYear(year: number) {
    if (year < RULES.PatchTitle.minYear || year > RULES.PatchTitle.maxYear) throw new ERR_LENGTH_INVALID(`Year must be between ${RULES.PatchTitle.minYear} and ${RULES.PatchTitle.maxYear}`);

    this.stack.push(`Changed year - ${this.title.year} > ${year}`);
    this.title.markModified('year');

    this.title.year = year;
  }

  async patchStudios(studios: string[]) {
    const trimmedArr: string[] = [];

    if (studios.length > RULES.PatchTitle.maxStudiosCount) throw new ERR_LENGTH_INVALID(`Studios can not be more than ${RULES.PatchTitle.maxStudiosCount}`);

    studios.forEach(studio => {
      const trimmed = studio.trim().replace(/\s+/g, ' ');

      if (!validator.isLength(trimmed, { min: RULES.PatchTitle.minStudioLength, max: RULES.PatchTitle.maxStudioLength })) throw new ERR_LENGTH_INVALID(`Studio name must be between ${RULES.PatchTitle.minStudioLength} and ${RULES.PatchTitle.maxStudioLength} symbols length`);

      trimmedArr.push(trimmed);
    });

    this.stack.push(`Changed studios - ${this.title.studios.join(', ')} > ${trimmedArr.join(', ')}`);
    this.title.markModified('studios');

    this.title.studios = trimmedArr;
  }



  async patchAgeRate(ageRate: TAnimeAgeRate) {
    if (!AnimeAgeRates.includes(ageRate)) throw new ERR_TYPE_INVALID(`Age rate ${ageRate} is invalid`);

    this.title.markModified('ageRate');

    this.stack.push(`Changed age rate (${this.title.ageRate} > ${ageRate})`);
    this.title.ageRate = ageRate;
  }

  async patchType(type: TTitleType) {
    if (!TitleTypes.includes(type)) throw new ERR_TYPE_INVALID(`Type ${type} is invalid`);

    this.title.markModified('type');

    this.stack.push(`Changed type (${this.title.type} > ${type})`);
    this.title.type = type;
  }

  async patchSeason(season: TAnimeSeason) {
    if (!AnimeSeasons.includes(season)) throw new ERR_TYPE_INVALID(`Season ${season} is invalid`);

    this.title.markModified('season');

    this.stack.push(`Changed age rate (${this.title.season} > ${season})`);
    this.title.season = season;
  }

  async patchCountry(country: TTitleCountry) {
    if (!TitleCountries.includes(country)) throw new ERR_TYPE_INVALID(`Country ${country} is invalid`);

    this.title.markModified('country');

    this.stack.push(`Changed country (${this.title.country} > ${country})`);
    this.title.country = country;
  }

  async patchStatus(status: TAnimeStatus) {
    if (!AnimeStatuses.includes(status)) throw new ERR_TYPE_INVALID(`Status ${status} is invalid`);

    this.title.markModified('status');

    this.stack.push(`Changed status (${this.title.status} > ${status})`);
    this.title.status = status;
  }



  /** Patch episode meta
   * action: edit - add if missing, edit if exist
   * action: delete - delete if exist, do nothing if not
   */
  async patchEpisodeMeta({ action, dateOut, names, order }: IChangeEpMeta) {
    this.title.markModified('episodesMeta');

    const ep = this.title.episodesMeta.find(el => el.order === order);

    if (action === 'edit') {
      if (dateOut < 0) throw new ERR_LENGTH_INVALID(`DateOut can not be less than 0`);
      if (order < RULES.PatchTitle.minEpisode || order > RULES.PatchTitle.maxEpisode) throw new ERR_LENGTH_INVALID(`Order must be between ${RULES.PatchTitle.minEpisode} and ${RULES.PatchTitle.maxEpisode}`);

      const ukrTrimmed = names.ukr.trim().replace(/\s+/g, ' ');
      const engTrimmed = names.eng.trim().replace(/\s+/g, ' ');

      if (!validator.isLength(ukrTrimmed, { min: RULES.PatchTitle.minNameLength, max: RULES.PatchTitle.maxNameLength })) throw new ERR_LENGTH_INVALID(`Ukranian name must be between ${RULES.PatchTitle.minNameLength} and ${RULES.PatchTitle.maxNameLength} symbols length`);
      if (!validator.isLength(engTrimmed, { min: RULES.PatchTitle.minNameLength, max: RULES.PatchTitle.maxNameLength })) throw new ERR_LENGTH_INVALID(`English name must be between ${RULES.PatchTitle.minNameLength} and ${RULES.PatchTitle.maxNameLength} symbols length`);

      // Meta not found, create new
      if (!ep) {
        this.stack.push(`Meta for #${order} episode added`);

        this.title.episodesMeta.push({
          dateOut,
          names: {
            eng: engTrimmed,
            ukr: ukrTrimmed
          },
          order
        });

        return;
      }

      this.stack.push(`Meta for #${order} episode edited (${ep.dateOut !== dateOut && `dateOut: (${ep.dateOut} > ${dateOut}),`} ${ep.names.ukr !== names.ukr && `Ukranian name: (${ep.names.ukr} > ${ukrTrimmed})`} ${ep.names.eng !== names.eng && `Eng name: (${ep.names.eng} > ${engTrimmed})`})`);

      ep.dateOut = dateOut;
      ep.names = {
        eng: engTrimmed,
        ukr: ukrTrimmed
      };
    } else if (action === 'delete') {
      if (!ep) return this.stack.push(`Meta for #${ep} is not found for deleting`);

      this.stack.push(`Meta for #${order} episode deleted`);

      this.title.episodesMeta = this.title.episodesMeta.filter(el => !(el.order === order));
    } else {
      throw new ERR_TYPE_INVALID(`Action ${action} is invalid`);
    }
  }

  /** Parse IMDB episodes meta */
  async parseIMDBEpisodesMeta(link: string) {
    let url = new URL('https://example.com');

    try {
      url = new URL(link);
    } catch (e) {
      throw new ERR_INVALID_PAYLOAD('URL parsing error');
    }

    if (url.host === 'example.com') throw new ERR_INVALID_PAYLOAD('URL parsing error');
    if (url.host !== 'www.imdb.com' && url.host !== 'imdb.com') throw new ERR_INVALID_PAYLOAD('Host is not IMDB');

    // End function if in test mode
    // TODO: Make integration test covering it 
    if (this.testMode) return;

    const href = `${url.origin}${url.pathname}`;
    const results: ITitleEpisodeMeta[] = [];

    const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');

      // Navigate & wait for loading
      await page.goto(href);
      await page.waitForSelector('#home_img');

      // Parse
      const data = await page.$$eval('.ipc-page-section', el => {
        const cfg = {
          titleClass: '.ipc-title__text',
          dateoutClass: '.sc-ccd6e31b-10',
          cardClass: '.sc-ccd6e31b-4'
        };

        const cards = el[2].querySelectorAll(cfg.cardClass);
        let tmp: ITitleEpisodeMeta[] = [];

        cards.forEach((card: any, i: number) => {
          const title = card.querySelector(cfg.titleClass).innerText.split('∙ ')[1] as string;
          i++;

          tmp.push({
            names: {
              eng: title,
              ukr: title.includes('Episode') ? `${i} епізод` : '~~~'
            },
            order: i,
            dateOut: card.querySelector(cfg.dateoutClass).innerText
          });
        });

        return tmp;
      });

      await browser.close();

      data.forEach(el => {
        results.push({
          dateOut: parseIMDBDate(`${el.dateOut}`),
          names: el.names,
          order: +el.order
        });
      });

      let newEpisodes = 0;

      results.forEach(meta => {
        if (!this.title.episodesMeta.some(el => el.order === meta.order)) {
          this.title.episodesMeta.push(meta);
          newEpisodes += 1;
        }
      });

      Logger.debug(`IMDb episodes meta parsed in ${this.title.id}`);
      this.stack.push(`IMDb episodes parsed`);

      this.title.markModified('episodesMeta');

      this.title.episodesMeta = this.title.episodesMeta.sort((a, b) => a.order - b.order);
      await this.save();
    } catch (e) {
      await browser.close();
      throw e;
    }
  }

  /** Upload new episode
   * Will check seriesAdd capability
   */
  async uploadEpisode({ file, user, dubber, episodeOrder, qualities }: IUploadEpisode, mockData?: IM_TitleSerciveUploadEpisode): Promise<ITitleEpisode> {
    let requestTimestamp = getNewUTC().timestamp;

    const { buffer, originalname, filename, mimetype } = file;

    const caps = await parseRoles(user.roles);
    const formData = new FormData();

    if (!caps.includes('root') && !caps.includes('seriesAdd')) throw new ERR_ACCESS_REJECTED();
    if (episodeOrder > RULES.PatchTitle.maxEpisode || episodeOrder < RULES.PatchTitle.minEpisode) throw new ERR_LENGTH_INVALID(`Episode order must be between ${RULES.PatchTitle.minEpisode} and ${RULES.PatchTitle.maxEpisode}`);

    // Reject if episode exist
    if (this.title.episodes.find(el => (el.dubberID === dubber.id && el.order === episodeOrder))) throw new ERR_ALREADY_EXIST(`Episode ${episodeOrder}/${dubber.id} already exist`);

    formData.append('file', new Blob([buffer], {
      type: mimetype
    }), originalname);
    formData.set('uploadedBy', user.id);
    formData.set('type', 'video/title/episode');
    formData.set('qualities', JSON.stringify(qualities));

    const ep: ITitleEpisode = {
      dubberID: dubber.id,
      order: episodeOrder,
      frames: [],
      qualities: {
        q1080: '',
        q240: null,
        q480: null,
        q4k: null,
        q720: null,
      }
    };

    try {
      const UPLOAD_DATA: IM_TitleSerciveUploadEpisode = {
        id: '',
        frames: 0
      };

      // Upload
      if (!this.testMode) {
        const { data } = await $upload.post<{ id: string, frames: number }>(`${config.URL.uploads}/upload`, formData);

        UPLOAD_DATA.id = data.id;
        UPLOAD_DATA.frames = data.frames;
      } else {
        if (!mockData) throw new E500('Mock data is not provided');

        UPLOAD_DATA.id = mockData.id;
        UPLOAD_DATA.frames = mockData.frames;
      }

      const { id, frames } = UPLOAD_DATA;

      // Set sources
      ep.qualities.q4k = qualities.includes(2160) ? `${config.URL.media}/${id}_q_2160` : null;
      ep.qualities.q1080 = `${config.URL.media}/${id}`;
      ep.qualities.q720 = qualities.includes(720) ? `${config.URL.media}/${id}_q_720` : null;
      ep.qualities.q480 = qualities.includes(480) ? `${config.URL.media}/${id}_q_480` : null;
      ep.qualities.q240 = qualities.includes(240) ? `${config.URL.media}/${id}_q_240` : null;

      // Set frames URLs
      let i = 0;

      while (i < frames) {
        ep.frames.push(`${config.URL.media}/${id}_f_${i}`);
        i++;
      }

      this.title.episodes.push(ep);

      // Sort episodes in order
      this.title.episodes.sort((a, b) => a.order - b.order);
      this.title.markModified('episodes');

      await this.save();

      if (!this.testMode) {
        const notifyNewEpisodePayload: INotifyNewEpisode = {
          dubberID: dubber.id,
          episodeOrder,
          titleID: this.title.id
        };

        Notify.broadcast({
          event: 'new_episode',
          payload: notifyNewEpisodePayload
        });

        // Send airing_started notify if this is first episode
        if (this.title.episodes.length === 1) {
          const notifyAiringStartedPayload: INotifyAiringStarted = {
            titleID: this.title.id
          };

          Notify.broadcast({
            event: 'airing_started',
            payload: notifyAiringStartedPayload
          });
        }
      }

      Logger.debug(`[TitleService]: Episode ${ep.order}/${ep.dubberID} uploaded in ${this.title.id} by ${user.id} ended within ${((getNewUTC().timestamp - requestTimestamp) / 1000).toFixed(2)}s`);

      return ep;
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
  }

  /** Delete episode
   * Will check seriesDelete capability
   */
  async deleteEpisode({ order, dubber, user }: IDeleteEpisode) {
    const caps = await parseRoles(user.roles);
    if (!caps.includes('root') && !caps.includes('seriesDelete')) throw new ERR_ACCESS_REJECTED(`You are not permitted to delete episodes :(`);

    const ep = this.title.episodes.find(el => el.order === order && el.dubberID === dubber.id);
    if (!ep) throw new E404(`Episode ${order}/${dubber.id} is not found`);



    try {
      if (!this.testMode) {
        await $http.delete(`${config.URL.uploads}/upload/${ep.qualities.q1080.split('/')[ep.qualities.q1080.split('/').length - 1]}`, {
          params: {
            withChildren: true,
            by: user.id
          }
        });
      }

      Logger.debug(`[TitleService]: Episode ${order}/${dubber.id} in ${this.title.id} deleted by ${user.id}`);
      this.stack.push(`Episode ${order}/${dubber.id} deleted`);

      this.title.episodes = this.title.episodes.filter(el => !(el.order === order && el.dubberID === dubber.id));
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

    this.title.markModified('episodes');
    await this.save();
  }

  /** Upload poster
   * Will check titleEdit capability
   */
  async uploadPoster({ file, user }: IUploadPoster, mockData?: IM_TitleServiceUploadPoster): Promise<{ id: string, posterURL: string }> {
    const { buffer, originalname, filename, mimetype } = file;

    const caps = await parseRoles(user.roles);
    const formData = new FormData();

    if (!caps.includes('root') && !caps.includes('titleEdit')) throw new ERR_ACCESS_REJECTED();

    formData.append('file', new Blob([buffer], {
      type: mimetype
    }), originalname);
    formData.set('uploadedBy', user.id);
    formData.set('type', 'photo/title/poster');

    try {
      const UPLOAD_DATA: IM_TitleServiceUploadPoster = {
        id: ''
      };

      // Upload poster
      if (!this.testMode) {
        const { data: postData } = await $http.post<{ id: string }>(`${config.URL.uploads}/upload`, formData);
        UPLOAD_DATA.id = postData.id;
      } else {
        if (!mockData) throw new E500(`Mock data is not provided`);

        UPLOAD_DATA.id = mockData.id;
      }

      // Remove old poster
      if (this.title.poster.match('animee.club') || this.title.poster.match(config.URL.baseURL)) {
        const uploadID = this.title.poster.split('/')[this.title.poster.split('/').length - 1];

        if (!this.testMode) {
          await $http.delete(`${config.URL.uploads}/upload/${uploadID}`, {
            params: {
              by: user.id
            }
          });
        }
      }

      Logger.debug(`[TitleService]: New poster for ${this.title.id} uploaded by ${user.id}`);

      const posterURL = `${config.URL.media}/${UPLOAD_DATA.id}`;

      this.title.poster = posterURL;
      this.title.markModified('poster');

      await this.save();

      return {
        id: UPLOAD_DATA.id,
        posterURL
      };
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
  }
}



export default TitleModel; 
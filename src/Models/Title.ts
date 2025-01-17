import mongoose, { HydratedDocument, Schema } from 'mongoose';
import { convert as urlSlugConvert } from 'url-slug';

import * as cfg from '../config';
import puppeteer from 'puppeteer';
import validator from 'validator';
import { $http, $upload } from '~/services/HTTPService';
import { AnimeAgeRates, AnimeGenres, AnimeSeasons, AnimeStatuses, ITitle, ITitleEpisode, ITitleEpisodeMeta, TAnimeAgeRate, TAnimeGenre, TAnimeSeason, TAnimeStatus, TTitleCountry, TTitleType, TitleCountries, TitleTypes } from '../interfaces/Title';
import { AxiosError } from 'axios';
import { E403, E404, E500, E503, ERR_ACCESS_REJECTED, ERR_ALREADY_EXIST, ERR_INVALID_PAYLOAD, ERR_LENGTH_INVALID, ERR_TYPE_INVALID } from '../services/ErrorService';
import { IA_UploadsUpload, NEKOMI_UPLOADS, TEpisodeQuality } from '../interfaces/http/Uploads';
import { IChangeEpMeta } from '../controllers/title';
import { IDubber } from '~/core/interfaces/IDubber';
import { INotifyAiringStarted, INotifyNewEpisode } from '../interfaces/services/Notify';
import { IUser } from '../interfaces/User';
import { Logger } from '../services/LoggerService';
import { Notify } from '../services/NotifyService';
import { config } from '../config';
import { createID, getUTC, parseIMDBDate } from '../handlers/handler';
import { parseRoles } from './Role';



interface ITitleServiceProps {
  title: HydratedDocument<ITitle>
  TestMode?: boolean
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
  mal_id?: string
  poster?: string
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



const ERR_DUBBER_MISSMATCH = new E403('Dubber can not change episodes in other teams', 'title:dubber_missmatch');



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
  details: String,
  mal_id: String,
  hikkaSyncedAt: Number,
}));



/** Create/path/delete User instance */
export class TitleService {
  readonly title: HydratedDocument<ITitle>;
  readonly stack: string[] = [];
  readonly TestMode = cfg.TestMode;

  constructor({ title, TestMode }: ITitleServiceProps) {
    this.title = title;

    if (TestMode) this.TestMode = TestMode;
  }

  static async create({ names, ageRate, country, description, details, genres, season, status, studios, type, year, episodesCount, id, mal_id, poster }: ITitleCreate, TestMode?: boolean): Promise<HydratedDocument<ITitle>> {
    const ID = TestMode ? id ?? createID() : createID();
    let code = urlSlugConvert(names?.eng ?? `Untitled ${ID}`, {
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
        ukr: names?.ukr || `Тайтл без назви ${ID}`,
        eng: names?.eng || `Untitled ${ID}`,
        alt: names?.alt || []
      },
      ageRate: ageRate || 'PG-13',
      country: country || 'Other',
      description: description || 'Це новий тайтл на nekomi.club :)',
      details: details || 'Якщо ви помітили цей тайтл, будь ласка напишіть про це в тікети на діскорд сервері nekomi.',
      episodes: [],
      episodesCount: episodesCount || null,
      episodesMeta: [],
      genres: genres || [],
      poster: poster ?? config.vars.defaultPoster,
      rating: {
        Animee: null,
        IMDB: null,
        mal: null,
        mal_poll: null
      },
      hikkaSyncedAt: 0,
      mal_id: mal_id ?? null,
      season: season || 'winter',
      status: status || 'announcement',
      studios: studios || ['Fullkekw'],
      type: type || 'serial',
      updatedAt: getUTC().timestamp,
      year: year || getUTC().year
    };

    const title = new TitleModel(payload);
    await title.save();

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
    this.title.updatedAt = getUTC().timestamp;
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
      if (!validator.isLength(trimmed, { min: config.VALIDATION.PatchTitle.minNameLength, max: config.VALIDATION.PatchTitle.maxNameLength })) throw new ERR_LENGTH_INVALID(`Name must be between ${config.VALIDATION.PatchTitle.minNameLength} and ${config.VALIDATION.PatchTitle.maxNameLength} symbols length`);

      this.stack.push(`Changed Ukranian name (${this.title.names.ukr} > ${trimmed})`);
      this.title.names.ukr = trimmed;
    }

    if (eng !== undefined) {
      const trimmed = eng.trim().replace(/\s+/g, ' ');
      if (!validator.isLength(trimmed, { min: config.VALIDATION.PatchTitle.minNameLength, max: config.VALIDATION.PatchTitle.maxNameLength })) throw new ERR_LENGTH_INVALID(`Name must be between ${config.VALIDATION.PatchTitle.minNameLength} and ${config.VALIDATION.PatchTitle.maxNameLength} symbols length`);

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
        if (!validator.isLength(trimmed, { min: config.VALIDATION.PatchTitle.minNameLength, max: config.VALIDATION.PatchTitle.maxNameLength })) throw new ERR_LENGTH_INVALID(`Name must be between ${config.VALIDATION.PatchTitle.minNameLength} and ${config.VALIDATION.PatchTitle.maxNameLength} symbols length`);

        newAlt.push(trimmed);
      });

      if (newAlt.length > config.VALIDATION.PatchTitle.maxAltNamesCount) throw new ERR_LENGTH_INVALID(`Alt names can not be more than ${config.VALIDATION.PatchTitle.maxAltNamesCount}`);

      this.stack.push(`Changed alternative names (${this.title.names.alt.join(', ')} > ${newAlt.join(', ')})`);
      this.title.names.alt = newAlt;
    }
  }

  async patchMalID({ mal_id }: { mal_id: string }) {
    this.title.markModified('mal_id');

    if (mal_id.length) {
      // Change mal id
      this.stack.push(`Changed mal_id (${this.title.mal_id} > ${mal_id})`);
      this.title.mal_id = mal_id;
    } else {
      // Delete mal id
      this.stack.push(`Changed mal_id (${this.title.mal_id} > null)`);
      this.title.mal_id = null;
    }
  }

  async patchDescription(description: string) {
    const trimmed = description.trim().replace(/\s+/g, ' ');
    if (!validator.isLength(trimmed, { max: config.VALIDATION.PatchTitle.maxDescriptionLength })) throw new ERR_LENGTH_INVALID(`Description must be shorter than ${config.VALIDATION.PatchTitle.maxDescriptionLength} symbols length`);

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
    if (!validator.isLength(trimmed, { max: config.VALIDATION.PatchTitle.maxDetailsLength })) throw new ERR_LENGTH_INVALID(`Details must be shorter than ${config.VALIDATION.PatchTitle.maxDetailsLength} symbols length`);

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

    if (count > config.VALIDATION.PatchTitle.maxEpisode || count < config.VALIDATION.PatchTitle.minEpisode) throw new ERR_LENGTH_INVALID(`Episodes count must be between ${config.VALIDATION.PatchTitle.minEpisode} and ${config.VALIDATION.PatchTitle.maxEpisode}`);

    this.title.markModified('episodesCount');

    this.stack.push(`Changed episodes count (${this.title.episodesCount} > ${count})`);
    this.title.episodesCount = count;
  }

  async patchGenres(genres: TAnimeGenre[]) {
    if (genres.length > config.VALIDATION.PatchTitle.maxGenresCount) throw new ERR_LENGTH_INVALID(`Genres can not be more than ${config.VALIDATION.PatchTitle.maxGenresCount}`);
    const trimmed_genres: TAnimeGenre[] = [];

    genres.forEach(genre => {
      const trimmed = genre.trim().replace(/\s+/g, ' ') as TAnimeGenre;

      if (!AnimeGenres.includes(trimmed)) throw new ERR_TYPE_INVALID(`Genre ${trimmed} is invalid`);

      trimmed_genres.push(trimmed);
    });

    this.title.markModified('genres');

    this.stack.push(`Changed genres (${this.title.genres.join(', ')} > ${trimmed_genres.join(', ')})`);
    this.title.genres = trimmed_genres;
  }

  /** Patch IMDb, Animee or mal rating
   * If rating is 0 or null, will set null
   */
  async patchRating(rating: number | null, type: 'IMDB' | 'Animee' | 'mal', mal_poll?: number) {
    if (rating === null || rating === 0) {
      // Set rating to null
      this.stack.push(`Changed ${type} rating( ${this.title.rating[type]} > null)`);

      this.title.rating[type] = null;
    } else {
      if (rating < config.VALIDATION.PatchTitle.minRating || rating > config.VALIDATION.PatchTitle.maxRating) throw new ERR_LENGTH_INVALID(`${type} rating must be between ${config.VALIDATION.PatchTitle.minRating} and ${config.VALIDATION.PatchTitle.maxRating}`);

      this.stack.push(`Changed ${type} rating (${this.title.rating[type]} > ${rating})`);

      this.title.rating[type] = +rating.toFixed(2);

      if (type === 'mal' && mal_poll !== undefined) {
        this.title.rating.mal_poll = mal_poll;
      }
    }

    this.title.markModified('rating');
  }

  async patchYear(year: number) {
    if (year < config.VALIDATION.PatchTitle.minYear || year > config.VALIDATION.PatchTitle.maxYear) throw new ERR_LENGTH_INVALID(`Year must be between ${config.VALIDATION.PatchTitle.minYear} and ${config.VALIDATION.PatchTitle.maxYear}`);

    this.stack.push(`Changed year - ${this.title.year} > ${year}`);
    this.title.markModified('year');

    this.title.year = year;
  }

  async patchStudios(studios: string[]) {
    const trimmedArr: string[] = [];

    if (studios.length > config.VALIDATION.PatchTitle.maxStudiosCount) throw new ERR_LENGTH_INVALID(`Studios can not be more than ${config.VALIDATION.PatchTitle.maxStudiosCount}`);

    studios.forEach(studio => {
      const trimmed = studio.trim().replace(/\s+/g, ' ');

      if (!validator.isLength(trimmed, { min: config.VALIDATION.PatchTitle.minStudioLength, max: config.VALIDATION.PatchTitle.maxStudioLength })) throw new ERR_LENGTH_INVALID(`Studio name must be between ${config.VALIDATION.PatchTitle.minStudioLength} and ${config.VALIDATION.PatchTitle.maxStudioLength} symbols length`);

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
      if (order < config.VALIDATION.PatchTitle.minEpisode || order > config.VALIDATION.PatchTitle.maxEpisode) throw new ERR_LENGTH_INVALID(`Order must be between ${config.VALIDATION.PatchTitle.minEpisode} and ${config.VALIDATION.PatchTitle.maxEpisode}`);

      const ukrTrimmed = names.ukr.trim().replace(/\s+/g, ' ');
      const engTrimmed = names.eng.trim().replace(/\s+/g, ' ');

      if (!validator.isLength(ukrTrimmed, { min: config.VALIDATION.PatchTitle.minNameLength, max: config.VALIDATION.PatchTitle.maxNameLength })) throw new ERR_LENGTH_INVALID(`Ukranian name must be between ${config.VALIDATION.PatchTitle.minNameLength} and ${config.VALIDATION.PatchTitle.maxNameLength} symbols length`);
      if (!validator.isLength(engTrimmed, { min: config.VALIDATION.PatchTitle.minNameLength, max: config.VALIDATION.PatchTitle.maxNameLength })) throw new ERR_LENGTH_INVALID(`English name must be between ${config.VALIDATION.PatchTitle.minNameLength} and ${config.VALIDATION.PatchTitle.maxNameLength} symbols length`);

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
    if (this.TestMode) return;

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
          /** Thu, Oct */
          dateoutClass: '.sc-ccd6e31b-10',
          cardClass: '.sc-ccd6e31b-1'
        };

        const cards = el[2].querySelectorAll(cfg.cardClass);
        let tmp: ITitleEpisodeMeta[] = [];

        cards.forEach((card: any, i: number) => {
          const title = card.querySelector('.ipc-title__text').innerText.split('∙ ')[1] as string;
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
   * Will save the document
   */
  async uploadEpisode({ file, user, dubber, episodeOrder, qualities }: IUploadEpisode, mockData?: IM_TitleSerciveUploadEpisode): Promise<ITitleEpisode> {
    let requestTimestamp = getUTC().timestamp;

    const { buffer, originalname, filename, mimetype } = file;

    const caps = await parseRoles(user.roles);
    const formData = new FormData();

    if (!caps.includes('root') && !caps.includes('seriesAdd')) throw new ERR_ACCESS_REJECTED();
    if (!caps.includes('root') && caps.includes('dubber') && dubber.id !== user.statistics.dubber_team_member) throw ERR_DUBBER_MISSMATCH;

    if (episodeOrder > config.VALIDATION.PatchTitle.maxEpisode || episodeOrder < config.VALIDATION.PatchTitle.minEpisode) throw new ERR_LENGTH_INVALID(`Episode order must be between ${config.VALIDATION.PatchTitle.minEpisode} and ${config.VALIDATION.PatchTitle.maxEpisode}`);

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
      if (!this.TestMode) {
        const { data } = await $upload.post<{ id: string, frames: number }>(`${config.URL.nekomi_uploads}/upload`, formData);

        UPLOAD_DATA.id = data.id;
        UPLOAD_DATA.frames = data.frames;
      } else {
        if (!mockData) throw new E500('Mock data is not provided');

        UPLOAD_DATA.id = mockData.id;
        UPLOAD_DATA.frames = mockData.frames;
      }

      const { id, frames } = UPLOAD_DATA;

      // Set sources
      ep.qualities.q4k = qualities.includes(2160) ? `${config.URL.nekomi_media}/${id}_q_2160` : null;
      ep.qualities.q1080 = `${config.URL.nekomi_media}/${id}`;
      ep.qualities.q720 = qualities.includes(720) ? `${config.URL.nekomi_media}/${id}_q_720` : null;
      ep.qualities.q480 = qualities.includes(480) ? `${config.URL.nekomi_media}/${id}_q_480` : null;
      ep.qualities.q240 = qualities.includes(240) ? `${config.URL.nekomi_media}/${id}_q_240` : null;

      // Set frames URLs
      let i = 0;

      while (i < frames) {
        ep.frames.push(`${config.URL.nekomi_media}/${id}_f_${i}`);
        i++;
      }

      this.title.episodes.push(ep);

      // Sort episodes in order
      this.title.episodes.sort((a, b) => a.order - b.order);
      this.title.markModified('episodes');

      await this.save();

      if (!this.TestMode) {
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

      Logger.debug(`[TitleService]: Episode ${ep.order}/${ep.dubberID} uploaded in ${this.title.id} by ${user.id} ended within ${((getUTC().timestamp - requestTimestamp) / 1000).toFixed(2)}s`);

      return ep;
    } catch (e) {
      if (e instanceof AxiosError) {
        if (e.code === 'ECONNREFUSED') {
          throw new E503('Nekomi-uploads is not available. Try in a few minutes');
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
    if (!caps.includes('root') && caps.includes('dubber') && dubber.id !== user.statistics.dubber_team_member) throw ERR_DUBBER_MISSMATCH;

    const ep = this.title.episodes.find(el => el.order === order && el.dubberID === dubber.id);
    if (!ep) throw new E404(`Episode ${order}/${dubber.id} is not found`);



    try {
      if (!this.TestMode) {
        const uploadID = `${ep.qualities.q1080.split('/')[ep.qualities.q1080.split('/').length - 1]}`;

        await $http.delete(NEKOMI_UPLOADS.delete_upload(uploadID), {
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
          throw new E503('Nekomi-uploads is not available. Try in a few minutes');
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
      if (!this.TestMode) {
        const { data: postData } = await $http.post<IA_UploadsUpload>(NEKOMI_UPLOADS.upload, formData);
        UPLOAD_DATA.id = postData.id;
      } else {
        if (!mockData) throw new E500(`Mock data is not provided`);

        UPLOAD_DATA.id = mockData.id;
      }

      // Remove old poster
      try {
        if (this.title.poster.match(cfg.config.DOMAIN.nekomi) || this.title.poster.match(config.URL.nekomi_core)) {
          const uploadID = this.title.poster.split('/')[this.title.poster.split('/').length - 1];

          if (!this.TestMode) {
            await $http.delete(NEKOMI_UPLOADS.delete_upload(uploadID), {
              params: {
                by: user.id
              }
            });
          }
        }
      } catch (e) {
        if (e instanceof AxiosError && e.response?.data.code === 404) {
          // Ignore
        } else {
          throw e;
        }
      }

      Logger.debug(`[TitleService]: New poster for ${this.title.id} uploaded by ${user.id}`);

      const posterURL = `${config.URL.nekomi_media}/${UPLOAD_DATA.id}`;

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
          throw new E503('Nekomi-uploads is not available. Try in a few minutes');
        }

        throw e;
      } else {
        throw e;
      }
    }
  }
}



export default TitleModel; 
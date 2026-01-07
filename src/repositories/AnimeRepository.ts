import AnimeValidators from '~/utils/validators/anime-validators';
import DTOService from '~/service/DataTransferService';
import DubberRepository from './DubberRepository';
import IAnime, { ANIME_GENRE, ANIME_RATING, ANIME_SEASON, ANIME_STATUS, ANIME_TYPE, IAnimeEpisode, IAnimePosterNode, IAnimeRelation, IAnimeSchedule, IAnimeScreenshotNode, IAnimeStudio } from '~/intf/IAnime';
import Logger from '~/service/LoggerService';
import UnifiedRepositoryClass, { UnifiedModelClass } from './UnifiedRepository';
import conf, { TestMode } from '~/conf';
import createId, { createNanoId } from '~/utils/create-id';
import createSlug from '~/utils/create-slug';
import mongoose, { Schema } from 'mongoose';
import { ISODateString, RepositoryQueriesType } from '~/intf/types';
import { NUS_UPLOAD_TYPE } from '~/intf/external-api/INekomiUploadService.api';
import { NekoError } from '~/service/ExceptionService';
import { NekomiUploadService } from '~/api/external/nekomi-upload-service';
import { getUTC, trimString } from '~/utils/utils';



/** Repository type. Reffers to the model interface */
type RepositoryType = IAnime;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  const queries: object[] = [{ id: query }, { slug: query }, { imdb_id: query }];
  const mal_id = Number(query);
  if (!isNaN(mal_id)) queries.push({ mal_id });

  return { $or: queries };
};



const schema = new Schema<RepositoryType>({
  id: String,
  mal_id: Number,
  imdb_id: String,
  slug: String,
  hikka_slug: String,

  posters: [Schema.Types.Mixed],
  hero_poster_author: String,

  year: Number,
  episodes_total: Number,
  episodes_released: Number,

  title_en: String,
  title_ja: String,
  title_ua: String,
  title_synonims: [Schema.Types.Mixed],

  synopsis_en: String,
  synopsis_ua: String,

  score: Number,
  scored_by: Number,

  relations: [Schema.Types.Mixed],
  studios: [Schema.Types.Mixed],
  screenshots: [Schema.Types.Mixed],
  schedule: [Schema.Types.Mixed],
  player: Object,
  episodes_meta: [Schema.Types.Mixed],
  ashdi_url: String,

  genres: [Schema.Types.Mixed],
  rating: String,
  status: String,
  season: String,
  type: String,
  content_season: Number,

  updated_at: String,
  created_at: String,
  about_synced_at: String,
  episodes_synced_at: String,

  is_DMCA_restricted: Boolean,
}, { strict: false, versionKey: false });

const model = mongoose.model<RepositoryType>('anime', schema);



interface IConstructorProps {
  _?: any
}

interface ISaveProps {
  /** Save document without diff writing */
  saveOnly?: boolean
}

interface ISetSlugOptions {
  /** @test is document exist */
  _documentExist?: boolean
}



interface ICreateProps {
  /** Save the document in the database. @default true */
  saveDocument?: boolean
}

interface ISetTitleProps {
  title_en?: string | null
  title_ja?: string | null
  title_ua?: string | null
  synonyms?: string[]
}

interface ISetSynopsisProps {
  synopsis_en?: string | null
  synopsis_ua?: string | null
}

interface ISetScoreProps {
  score?: number
  scoredBy?: number
}



/** Bare user model implementation */
export class AnimeModel extends UnifiedModelClass<RepositoryType> {
  constructor() {
    super(model, queries);

    this.RepositoryName = 'AnimeRepository';
  }



  get document(): RepositoryType {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    return DTOService.anime(this._doc, true);
  }



  async save() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._set('updated_at', getUTC().ISO);

    await this._save({ id: this._doc.id });
  }
}



export class AnimeRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor(props?: IConstructorProps) {
    super(model, queries);

    this.RepositoryName = 'AnimeRepository';
  }



  get document(): RepositoryType {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    return DTOService.anime(this._doc, true);
  }

  async save(props?: ISaveProps) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._set('updated_at', getUTC().ISO);

    await this._save({ id: this._doc.id, ...props });
  }



  async deleteOne(id: string): Promise<void> {
    throw new NekoError('sys:not_implemented');

    // AnimeSearch.update();
  }



  /** @unavailable */
  async deleteMany(): Promise<void> {
    throw new NekoError('sys:not_implemented', `Method is unavailable`);
  }



  /** 
   * Creates new anime document and initialize service part of repository
   */
  async create(props?: ICreateProps): Promise<IAnime> {
    const saveDocument = props?.saveDocument ?? true;

    const id = TestMode ? `~testing-${createNanoId()}` : createId();
    const title = `Untitled ${id.toLowerCase()}`;
    const slug = createSlug(title);



    const payload: RepositoryType = {
      id,
      mal_id: null,
      imdb_id: null,
      slug,
      hikka_slug: null,

      posters: [
        {
          small: conf.vars.defaultPoster,
          medium: conf.vars.defaultPoster,
          original: conf.vars.defaultPoster,
          authorId: null,
          pull_hash: 'null',
          is_hero: true,
        }
      ],
      hero_poster_author: conf.vars.INTERNAL_ID,

      year: null,
      episodes_total: null,
      episodes_released: null,

      title_en: title,
      title_ja: title,
      title_ua: null,
      title_synonims: [],

      synopsis_en: null,
      synopsis_ua: null,

      score: 0,
      scored_by: 0,

      relations: [],
      studios: [],
      screenshots: [],
      schedule: [],
      player: {
        dubbed: [],
        subbed: []
      },
      episodes_meta: [],
      ashdi_url: null,

      genres: [],
      rating: null,
      status: null,
      season: null,
      type: null,
      content_season: null,

      updated_at: getUTC().ISO,
      created_at: getUTC().ISO,
      about_synced_at: null,
      episodes_synced_at: null,
    };

    const document = new model(payload);
    if (saveDocument) await document.save();

    Logger.info(`[${this.RepositoryName}]: New document has been created! [id: ${id}]`);
    this._doc = document;

    return DTOService.anime(payload, true);
  }



  /**
   * Set malId
   * 
   * @tested
   */
  async setMalId(id: number | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (id === null || id < 0) id = null;

    this._set('mal_id', id);
  }



  /**
   * Set IMDB id
   * 
   * @tested
   */
  async setIMDBId(id: string | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (id === null || !id.length) id = null;

    this._set('imdb_id', id);
  }



  /** 
   * Set slug
   *
   * @returns accepted slug (if slug was occupied, will append it to it) 
   * @tested
   */
  async setSlug(slug: string, opts?: ISetSlugOptions): Promise<string> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    slug = createSlug(trimString(slug));

    let isDocumentExist = false;

    // Define is document exist
    if (TestMode) {
      isDocumentExist = Boolean(opts?._documentExist);
    } else {
      const exist = await this.safeGetOne(slug);

      // Ensure that slug is unique. Otherwise append id
      if (exist && exist.id !== this._doc.id) isDocumentExist = true;
    }

    if (isDocumentExist) slug += `-${createNanoId(4)}`;

    this._set('slug', slug);

    return slug;
  }



  /** 
   * Set hikka.io slug
   * 
   * @tested
   */
  async setHikkaSlug(slug: string | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (slug === null || !slug.length) slug = null;

    this._set('hikka_slug', slug);
  }



  /**
   * Set year
   * 
   * @testing
   */
  setYear(year: number | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (year !== null) AnimeValidators.year.parse(year);

    this._set('year', year);
  }



  /**
   * Set episodes total
   * 
   * @tested
   */
  setEpisodesTotal(episodes: number | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (episodes === 0 || episodes === null) episodes = null;
    else AnimeValidators.episodes.parse(episodes);

    this._set('episodes_total', episodes);
  }



  /**
   * Set episodes released
   * 
   * @tested
   */
  setEpisodesReleased(episodes: number | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (episodes === 0 || episodes === null) episodes = null;
    else AnimeValidators.episodes.parse(episodes);

    this._set('episodes_released', episodes);
  }



  /**
   * Set title
   * 
   * @testing
   */
  setTitle({ synonyms, title_en, title_ja, title_ua }: ISetTitleProps) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const _setTitle = (value: string | null, key: 'title_en' | 'title_ja' | 'title_ua') => {
      if (!value?.length) value = null;

      if (value?.length) {
        value = trimString(value);

        AnimeValidators.title.parse(value);
      }

      this._set(key, value);
    };



    if (title_en || title_en === null) _setTitle(title_en, 'title_en');
    if (title_ja || title_ja === null) _setTitle(title_ja, 'title_ja');
    if (title_ua !== undefined || title_ua === null) _setTitle(title_ua, 'title_ua');

    if (synonyms?.length) {
      synonyms = synonyms.map(synonym => trimString(synonym));

      AnimeValidators.titleSynonims.parse(synonyms);

      this._set('title_synonims', synonyms);
    }
  }



  /**
   * Set synopsis
   * 
   * @tested
   */
  setSynopsis({ synopsis_en, synopsis_ua }: ISetSynopsisProps) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (synopsis_en || synopsis_en === null) {
      if (synopsis_en) {
        synopsis_en = trimString(synopsis_en);

        AnimeValidators.synopsis.parse(synopsis_en);
      }

      this._set('synopsis_en', synopsis_en);
    }

    if (synopsis_ua || synopsis_ua === null) {
      if (synopsis_ua) {
        synopsis_ua = trimString(synopsis_ua);

        AnimeValidators.synopsis.parse(synopsis_ua);
      }

      this._set('synopsis_ua', synopsis_ua);
    }
  }



  /**
   * Set score & scored by
   * 
   * @tested
   */
  setScore({ score, scoredBy }: ISetScoreProps) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (score) {
      AnimeValidators.score.parse(score);

      this._set('score', Number(score.toFixed(2)));
    }

    if (scoredBy) {
      AnimeValidators.scoredBy.parse(scoredBy);

      this._set('scored_by', Number(scoredBy.toFixed(0)));
    }
  }



  // /**
  //  * Append related document
  //  * 
  //  * @todo
  //  */
  // async appendRelation(id: string) {
  //   throw new NekoError('sys:not_implemented');
  // }

  // /**
  //  * Remove related document
  //  * 
  //  * @todo
  //  */
  // async removeRelation(id: string) {
  //   throw new NekoError('sys:not_implemented');
  // }



  /**
   * Set related documents
   * 
   * ! Must be refactored into append/remove methods after 3.0.0
   */
  _setRelations(relations: IAnimeRelation[] | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (relations === null) relations = [];

    this._set('relations', relations);
  }



  // /**
  //  * Append studio
  //  * 
  //  * @todo
  //  */
  // async appendStudio(id: string) {
  //   throw new NekoError('sys:not_implemented');
  // }



  // /**
  //  * Remove studio
  //  * 
  //  * @todo
  //  */
  // async removeStudio(id: string) {
  //   throw new NekoError('sys:not_implemented');
  // }



  /**
   * Set studios
   * 
   * ! Must be refactored into append/remove methods after 3.0.0
   */
  _setStudios(studios: IAnimeStudio[] | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (studios === null) studios = [];

    this._set('studios', studios);
  }



  /**
   * Set schedule
   * 
   * ! Must be refactored into append/remove methods after 3.0.0
   * @tested
   */
  _setSchedule(schedule: IAnimeSchedule[]) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._set('schedule', schedule);
  }



  /**
   * Set genres
   * 
   * ! Must be refactored into append/remove methods after 3.0.0
   * @tested
   */
  _setGenres(genres: ANIME_GENRE[]) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._set('genres', genres);
  }



  /**
   * Set rating
   * 
   * @tested
   */
  setRating = (rating: ANIME_RATING | null) => this.setTypedValue(rating, 'rating');

  /** Parse string to type value */
  parseRating = (rating: string) => this.parseStringToType<ANIME_RATING>(rating, ANIME_RATING);



  /**
   * Set status
   * 
   * @tested
   */
  setStatus = (status: ANIME_STATUS | null) => this.setTypedValue(status, 'status');

  /** Parse string to type value */
  parseStatus = (status: string) => this.parseStringToType<ANIME_STATUS>(status, ANIME_STATUS);



  /**
   * Set season
   * 
   * @tested
   */
  setSeason = (season: ANIME_SEASON | null) => this.setTypedValue(season, 'season');

  /** Parse string to type value */
  parseSeason = (season: string) => this.parseStringToType<ANIME_SEASON>(season, ANIME_SEASON);



  /**
   * Set type
   * 
   * @tested
   */
  setType = (type: ANIME_TYPE | null) => this.setTypedValue(type, 'type');

  /** Parse string to type value */
  parseType = (type: string) => this.parseStringToType<ANIME_TYPE>(type, ANIME_TYPE);



  /**
   * Set is DMCA restricted
   * 
   * @tested
   */
  setIsDMCARestcited(flag: boolean) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._set('is_DMCA_restricted', flag);
  }



  // /**
  //  * Edit anime episode
  //  * 
  //  * @returns IAnimeEpisode
  //  * @todo
  //  */
  // async editEpisode(episode: IAnimeEpisode): Promise<IAnimeEpisode> {
  //   throw new NekoError('sys:not_implemented');
  // }



  // /**
  //  * Remove episode
  //  * 
  //  * @todo
  //  */
  // async removeEpisode(order: number, dubberId: string) {
  //   throw new NekoError('sys:not_implemented');
  // }



  // /**
  //  * Edit episode meta
  //  * 
  //  * @returns IAnimeEpisodeMeta
  //  * @todo
  //  */
  // async editEpisodeMeta(meta: IAnimeEpisodeMeta): Promise<IAnimeEpisodeMeta> {
  //   throw new NekoError('sys:not_implemented');
  // }



  // /**
  //  * Remove episode meta
  //  * 
  //  * @todo
  //  */
  // async removeEpisodeMeta(order: number) {
  //   throw new NekoError('sys:not_implemented');
  // }



  /**
   * Set episodes meta
   * 
   * ! Must be refactored into append/remove methods after 3.0.0
   */
  _setEpisodesMeta(eps: IAnimeEpisode[]) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._set('episodes_meta', eps);
  }



  /**
   * Set hero poster author
   * 
   * @testing
   */
  async setHeroPosterAuthor(id: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Ensure that dubber is exist
    await DubberRepository.getOne(id);

    this._set('hero_poster_author', id);
  }



  /**
   * Upload poster
   * 
   * @autosave
   * @testing
   */
  async uploadPoster(buffer: Buffer, uploaderId: string, authorId: string | null, _unprocessedAuthorName?: string): Promise<IAnimePosterNode> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const { objects } = await NekomiUploadService.uploadFile({ buffer, type: NUS_UPLOAD_TYPE.PHOTO_POSTER_SOURCE, uploaderId });

    const poster = objects.find(el => el.type === NUS_UPLOAD_TYPE.PHOTO_POSTER_SOURCE);
    const posterM = objects.find(el => el.type === NUS_UPLOAD_TYPE.PHOTO_POSTER_M);
    const posterS = objects.find(el => el.type === NUS_UPLOAD_TYPE.PHOTO_POSTER_S);

    if (!poster || !posterM || !posterS) throw new NekoError('nus:object_not_found', `poster: ${Boolean(poster)}; posterM: ${Boolean(posterM)}; posterS: ${Boolean(posterS)}`);

    const node: IAnimePosterNode = {
      original: poster.url,
      medium: posterM.url,
      small: posterS.url,
      authorId,
      is_hero: false,
      pull_hash: poster.hash,
      _unprocessedAuthorName
    };

    this._doc.posters.push(node);
    this._doc.markModified('posters');

    await this.save({ saveOnly: true });

    return node;
  }



  /**
   * Remove poster
   * 
   * @autosave
   * @testing
   */
  async removePoster(hash: string, userId: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const poster = this._doc.posters.find(el => el.pull_hash === hash);
    if (!poster) return;

    await NekomiUploadService.deleteFile(NekomiUploadService.getId(poster.original), userId);

    this._doc.posters = this._doc.posters.filter(el => el.pull_hash !== hash);
    this._doc.markModified('posters');

    // Define hero poster
    if (!this._doc.posters.some(el => el.is_hero)) {
      console.log('define hero poster');
    }

    await this.save({ saveOnly: true });
  }



  /**
   * Set is poster hero
   * 
   * @testing
   */
  async setIsPosterHero(hash: string, isHero?: boolean) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const poster = this._doc.posters.find(el => el.pull_hash === hash);
    if (!poster) throw new NekoError('sys:not_found', `Poster with hash (${hash}) is not found`);

    if (isHero !== undefined) {
      poster.is_hero = isHero;
    }

    this._doc.markModified('posters');
  }



  /**
   * Upload screenshot
   * 
   * @autosave
   * @testing
   */
  async uploadScreenshot(buffer: Buffer, uploaderId: string): Promise<IAnimeScreenshotNode> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const { objects } = await NekomiUploadService.uploadFile({ buffer, type: NUS_UPLOAD_TYPE.PHOTO_SCREENSHOT_SOURCE, uploaderId });

    const screenshot = objects.find(el => el.type === NUS_UPLOAD_TYPE.PHOTO_SCREENSHOT_SOURCE);
    const screenshotM = objects.find(el => el.type === NUS_UPLOAD_TYPE.PHOTO_SCREENSHOT_M);

    if (!screenshot || !screenshotM) throw new NekoError('nus:object_not_found', `screenshot: ${Boolean(screenshot)}; screenshotM: ${Boolean(screenshotM)}`);

    const node: IAnimeScreenshotNode = {
      pull_hash: screenshot.hash,
      original: screenshot.url,
      preview: screenshotM.url,
    };

    this._doc.screenshots.push(node);
    this._doc.markModified('screenshots');

    await this.save({ saveOnly: true });

    return node;
  }



  /**
   * Remove screenshot
   * 
   * @autosave
   * @testing
   */
  async removeScreenshot(hash: string, userId: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const screenshot = this._doc.screenshots.find(el => el.pull_hash === hash);
    if (!screenshot) return;

    await NekomiUploadService.deleteFile(NekomiUploadService.getId(screenshot.original), userId);

    this._doc.screenshots = this._doc.screenshots.filter(el => el.pull_hash !== hash);
    this._doc.markModified('screenshots');

    await this.save({ saveOnly: true });
  }



  /**
   * Set sync timestamp
   * 
   * @tested
   */
  setSync(key: keyof Pick<IAnime, 'episodes_synced_at' | 'about_synced_at'>, ts: ISODateString | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._set(key, ts);
  }



  /** 
   * Parse string value to enum type
   * 
   * @param value string value to be parsed
   * @param list object to parse
   * 
   * @tested cumulative
   */
  parseStringToType<E>(value: string | null, list: object): E {
    for (const key in list) {
      if (list[key] === value) return list[key];
    }

    throw new NekoError('sys:type_invalid', `Cannot parse ${value} to listed type`);
  }



  /** 
   * Set typed value (rate, media, etc)
   * 
   * @param value typed value
   * @param key document key
   * 
   * @tested cumulative
   */
  protected setTypedValue(value: string | null, key: keyof Pick<IAnime, 'rating' | 'type' | 'status' | 'season'>) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._set(key, value as any);
  }
}



const AnimeRepository = new AnimeRepositoryClass();

export default AnimeRepository;
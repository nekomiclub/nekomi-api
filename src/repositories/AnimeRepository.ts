import DocumentDTO from '~/service/DataTransferService';
import IAnime, { ANIME_GENRE, ANIME_RATE, ANIME_SEASON, ANIME_STATUS, ANIME_TYPE, IAnimeEpisodeMeta, IAnimeSchedule } from '~/intf/IAnime';
import Logger from '~/service/LoggerService';
import UnifiedRepositoryClass from './UnifiedRepository';
import conf from '~/config';
import createId from '~/utils/create-id';
import createSlug from '~/utils/create-slug';
import mongoose, { Schema } from 'mongoose';
import { NekoError } from '~/service/ExceptionService';
import { RepositoryQueriesType } from '~/intf/types';
import { getUTC } from '~/utils/utils';



/** Repository type. Reffers to the model interface */
type RepositoryType = IAnime;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ id: query }, { slug: query }] };
};



const schema = new Schema<RepositoryType>({
  id: String,
  created_at: String,
  episodes: Schema.Types.Mixed,
  episodes_meta: Schema.Types.Mixed,
  episodes_released: Number,
  genres: Schema.Types.Mixed,
  hero_poster: String,
  hero_poster_author: String,
  hikka_slug: String,
  hikka_sync: String,
  imdb_id: String,
  is_DMCA_restricted: Boolean,
  mal_id: Number,
  myanimelist_sync: String,
  pictures: Schema.Types.Mixed,
  posters: Schema.Types.Mixed,
  rate: String,
  related: Schema.Types.Mixed,
  schedule: Schema.Types.Mixed,
  score: Number,
  scored_by: Number,
  season: String,
  slug: String,
  status: String,
  studios: Schema.Types.Mixed,
  synopsis_en: String,
  synopsis_ua: String,
  title_en: String,
  title_ja: String,
  title_ua: String,
  title_synonims: Schema.Types.Mixed,
  type: String,
  updated_at: String,
  year: Number,
  shikimori_sync: String
}, { strict: false });

const model = mongoose.model<RepositoryType>('anime', schema);



interface ICreateProps {
  /** Save the document in the database. @default true */
  saveDocument?: boolean
}

interface ISetTitleProps {
  title_en?: IAnime['title_en']
  title_ja?: IAnime['title_ja']
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



export class AnimeRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor(query?: string) {
    super(model, queries, query);
  }



  get document(): RepositoryType | null {
    return this._doc ? DocumentDTO.anime(this._doc, true) : null;
  }

  async save() {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    await this.update();

    Logger.debug(`[AnimeService]: Document saved. [id: ${this._doc.id}; diff: ${this.diff.join('; ')}]`);
  }



  /** 
   * Creates new anime document and initialize service part of repository
   */
  async create(props?: ICreateProps): Promise<IAnime> {
    const saveDocument = props?.saveDocument ?? true;

    let id = createId();
    const title = `Untitled ${id}`;
    const slug = createSlug(title);

    // Ensure that document with the same id is not exist, if so recreate id with extended length
    if (saveDocument && await this.safeGetOne(id)) id = createId(12);



    const payload: IAnime = {
      id,
      mal_id: null,
      imdb_id: null,
      slug,
      hikka_slug: null,

      hero_poster: conf.vars.defaultPoster,
      hero_poster_author: null,
      posters: [],

      year: getUTC().year,
      episodes_released: null,

      title_en: title,
      title_ja: title,
      title_ua: null,
      title_synonims: [],

      synopsis_en: null,
      synopsis_ua: null,

      score: 0,
      scored_by: 0,

      related: [],
      studios: [],
      pictures: [],
      schedule: [],
      episodes: [],
      episodes_meta: [],

      genres: [],
      rate: ANIME_RATE.G,
      status: ANIME_STATUS.NOT_YET_AIRED,
      season: ANIME_SEASON.FALL,
      type: ANIME_TYPE.UNKNOWN,

      updated_at: getUTC().ISO,
      created_at: getUTC().ISO,
      hikka_sync: null,
      myanimelist_sync: null,
      shikimori_sync: null,
    };

    const document = new model(payload);
    if (saveDocument) await document.save();

    Logger.info(`[AnimeRepository]: New document has been created! [id: ${id}]`);
    this._doc = document;

    return DocumentDTO.anime(payload, true);
  }



  /**
   * Set malId
   * 
   * @tested
   */
  setMalId(id: number | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (id === null || id < 0) id = null;

    this.set('mal_id', id);
  }



  /**
   * Set IMDB id
   * 
   * @testing
   */
  setIMDBId(id: string | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (id === null || !id.length) id = null;

    this.set('imdb_id', id);
  }



  /** 
   * Set slug
   *
   * @returns accepted slug (if slug was occupied, will append it to it) 
   * @testing
   */
  async setSlug(slug: string): Promise<string> {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    return slug;
  }



  /** 
   * Set hikka.io slug
   * 
   * @testing
   */
  async setHikkaSlug(slug: string | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (slug === null || !slug.length) slug = null;

    this.set('hikka_slug', slug);
  }



  /**
   * Set hero poster author
   * 
   * @testing
   */
  async setHeroPosterAuthor(id: string | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (id === null || !id.length) id = null;

    this.set('hero_poster_author', id);
  }



  /**
   * Set title
   * Updating english title will cumulative update the slug
   * 
   * @testing
   */
  async setTitle({ synonyms, title_en, title_ja, title_ua }: ISetTitleProps) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }



  /**
   * Set synopsis
   * 
   * @testing
   */
  async setSynopsis({ synopsis_en, synopsis_ua }: ISetSynopsisProps) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }



  /**
   * Set score
   * 
   * @testing
   */
  async setScore({ score, scoredBy }: ISetScoreProps) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }



  // /**
  //  * Append related document
  //  * 
  //  * @todo
  //  */
  // async appendRelated(id: string) {
  //   throw new NekoError('ERROR_NOT_IMPLEMENTED');
  // }

  // /**
  //  * Remove related document
  //  * 
  //  * @todo
  //  */
  // async removeRelated(id: string) {
  //   throw new NekoError('ERROR_NOT_IMPLEMENTED');
  // }



  /**
   * Set related documents
   * 
   * @notice use till new Append/Remove methods are not available
   */
  async setRelated(related: string[] | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (related === null) related = [];

    this.set('related', related);
  }



  // /**
  //  * Append studio
  //  * 
  //  * @todo
  //  */
  // async appendStudio(id: string) {
  //   throw new NekoError('ERROR_NOT_IMPLEMENTED');
  // }



  // /**
  //  * Remove studio
  //  * 
  //  * @todo
  //  */
  // async removeStudio(id: string) {
  //   throw new NekoError('ERROR_NOT_IMPLEMENTED');
  // }



  /**
   * Set studios
   * 
   * @notice use till new Append/Remove methods are not available
   */
  async setStudios(studios: string[] | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (studios === null) studios = [];

    this.set('studios', studios);
  }



  /**
   * Set schedule
   * 
   * @testing
   */
  async setSchedule(schedule: IAnimeSchedule[]) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    this.set('schedule', schedule);
  }



  /**
   * Set genres
   * 
   * @testing
   */
  async setGenres(genres: ANIME_GENRE[]) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    this.set('genres', genres);
  }



  /**
   * Set rate
   * 
   * @testing
   */
  async setRate(rate: ANIME_RATE) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    this.set('rate', rate);
  }



  /**
   * Set season
   * 
   * @testing
   */
  async setSeason(season: ANIME_SEASON) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    this.set('season', season);
  }



  /**
   * Set type
   * 
   * @testing
   */
  async setType(type: ANIME_TYPE) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    this.set('type', type);
  }



  /**
   * Set is DMCA restricted
   * 
   * @tesring
   */
  async setIsDMCARestcited(flag: boolean) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    this.set('is_DMCA_restricted', flag);
  }



  // /**
  //  * Edit anime episode
  //  * 
  //  * @returns IAnimeEpisode
  //  * @todo
  //  */
  // async editEpisode(episode: IAnimeEpisode): Promise<IAnimeEpisode> {
  //   throw new NekoError('ERROR_NOT_IMPLEMENTED');
  // }



  // /**
  //  * Remove episode
  //  * 
  //  * @todo
  //  */
  // async removeEpisode(order: number, dubberId: string) {
  //   throw new NekoError('ERROR_NOT_IMPLEMENTED');
  // }



  /**
   * Edit episode meta
   * 
   * @returns IAnimeEpisodeMeta
   * @todo
   */
  async editEpisodeMeta(meta: IAnimeEpisodeMeta): Promise<IAnimeEpisodeMeta> {
    throw new NekoError('ERROR_NOT_IMPLEMENTED');
  }



  /**
   * Remove episode meta
   * 
   * @todo
   */
  async removeEpisodeMeta(order: number) {
    throw new NekoError('ERROR_NOT_IMPLEMENTED');
  }



  /**
   * Upload hero poster
   * 
   * @returns hero poster id
   * @todo
   */
  async uploadHeroPoster(file: File): Promise<string> {
    throw new NekoError('ERROR_NOT_IMPLEMENTED');
  }



  /**
   * Upload anime picture
   * 
   * @returns picture id
   * @todo
   */
  async uploadPicture(file: File): Promise<string> {
    throw new NekoError('ERROR_NOT_IMPLEMENTED');
  }



  /**
   * Remove picture
   * 
   * @todo
   */
  async removePicture(id: string) {
    throw new NekoError('ERROR_NOT_IMPLEMENTED');
  }
}



const AnimeRepository = new AnimeRepositoryClass();

export default AnimeRepository;
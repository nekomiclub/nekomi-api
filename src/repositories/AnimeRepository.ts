import DocumentDTO from '~/service/DataTransferService';
import IAnime, { ANIME_GENRE, ANIME_RATE, ANIME_SEASON, ANIME_STATUS, ANIME_TYPE, IAnimeEpisode, IAnimeEpisodeMeta, IAnimeSchedule } from '~/intf/IAnime';
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



  /** 
   * Creates new anime document and initialize service part of repository
   */
  async create(props?: ICreateProps): Promise<IAnime> {
    const saveDocument = props?.saveDocument ?? true;

    let id = createId();
    const title = `Untitled ${id}`;
    const slug = createSlug(title);

    // Ensure that document with the same id is not exist, if so recreate id with extended length
    if (await this.safeGetOne(id)) id = createId(12);



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
   * Set new malId
   * 
   * @testing
   */
  setMalId(id: number | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (id === null || id < 0) id = null;

    this.diff.push(`MalID changed (${this._doc.mal_id} > ${id})`);

    this._doc.mal_id = id;
    this._doc.markModified('mal_id');
  }



  /**
   * Set new IMDB id
   * 
   * @testing
   */
  setIMDBId(id: string | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (id === null || !id.length) id = null;

    this.diff.push(`IMDB ID changed (${this._doc.imdb_id} > ${id})`);

    this._doc.imdb_id = id;
    this._doc.markModified('imdb_id');
  }



  /** 
   * Set new slug
   *
   * @returns accepted slug (if slug was occupied, will append it to it) 
   * @testing
   */
  async setSlug(slug: string): Promise<string> {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    return slug;
  }



  /** 
   * Set new hikka.io slug
   */
  async setHikkaSlug(slug: string | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (slug === null || !slug.length) slug = null;

    this.diff.push(`Hikka slug changed (${this._doc.hikka_slug} > ${slug})`);

    this._doc.hikka_slug = slug;
    this._doc.markModified('hikka_slug');
  }



  /**
   * Set new hero poster author
   */
  async setHeroPosterAuthor(id: string | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (id === null || !id.length) id = null;

    this.diff.push(`Hero poster author changed (${this._doc.hero_poster_author} > ${id})`);

    this._doc.hero_poster_author = id;
    this._doc.markModified('hero_poster_author');
  }



  async setTitle({ synonyms, title_en, title_ja, title_ua }: ISetTitleProps) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }



  async setSynopsis({ synopsis_en, synopsis_ua }: ISetSynopsisProps) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }



  async setScore({ score, scoredBy }: ISetScoreProps) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }



  async setRelated(related: string[] | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }



  async setStudios(studios: string[] | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }



  async setPictures(pictures: string[] | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }



  async setSchedule(schedule: IAnimeSchedule) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }



  async setGenres(genres: ANIME_GENRE[]) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }



  async setRate(rate: ANIME_RATE) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }



  async setSeason(season: ANIME_SEASON) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }



  async setType(type: ANIME_TYPE) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }



  async setIsDMCARestcited(flag: boolean) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');
  }


  async editEpisode(episode: IAnimeEpisode) {
    throw new NekoError('ERROR_NOT_IMPLEMENTED');
  }



  async removeEpisode(episode: IAnimeEpisode) {
    throw new NekoError('ERROR_NOT_IMPLEMENTED');
  }



  async editEpisodeMeta(meta: IAnimeEpisodeMeta) {
    throw new NekoError('ERROR_NOT_IMPLEMENTED');
  }



  async removeEpisodeMeta(meta: IAnimeEpisodeMeta) {
    throw new NekoError('ERROR_NOT_IMPLEMENTED');
  }



  async uploadHeroPoster() {
    throw new NekoError('ERROR_NOT_IMPLEMENTED');
  }



  async uploadPictures() {
    throw new NekoError('ERROR_NOT_IMPLEMENTED');
  }



  async removePicture(id: string) {
    throw new NekoError('ERROR_NOT_IMPLEMENTED');
  }
}



const AnimeRepository = new AnimeRepositoryClass();

export default AnimeRepository;
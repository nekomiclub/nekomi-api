import DocumentDTO from '~/service/DataTransferService';
import IAnime, { ANIME_RATE, ANIME_SEASON, ANIME_STATUS, ANIME_TYPE } from '~/intf/IAnime';
import Logger from '~/service/LoggerService';
import UnifiedRepositoryClass from './UnifiedRepository';
import conf from '~/config';
import createId from '~/utils/create-id';
import createSlug from '~/utils/create-slug';
import mongoose, { Schema } from 'mongoose';
import { RepositoryQueriesType, RepositorySchemaType } from '~/intf/types';
import { getUTC } from '~/utils/utils';



/** Repository type. Reffers to the model interface */
type RepositoryType = IAnime;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ id: query }, { slug: query }] };
};



const schema: RepositorySchemaType<RepositoryType> = {
  id: String,
  created_at: String,
  episodes: Array,
  episodes_meta: Array,
  episodes_released: Number,
  genres: Array,
  hero_poster: String,
  hero_poster_author: String,
  hikka_slug: String,
  hikka_sync: String,
  imdb_id: String,
  is_DMCA_restricted: Boolean,
  mal_id: Number,
  myanimelist_sync: String,
  pictures: Array,
  posters: Array,
  rate: String,
  related: Array,
  schedule: Array,
  score: Number,
  scored_by: Number,
  season: String,
  slug: String,
  status: String,
  studios: Array,
  synopsis_en: String,
  synopsis_ua: String,
  title_en: String,
  title_ja: String,
  title_ua: String,
  title_synonims: Array,
  type: String,
  updated_at: String,
  year: Number,
  shikimori_sync: String
};

const model = mongoose.model<RepositoryType>('anime', new Schema(schema));



export class AnimeRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor(query?: string) {
    super(model, queries, query);
  }



  get document() {
    return this._doc ? DocumentDTO.anime(this._doc, true) : null;
  }



  /** 
   * Creates new anime document and initialize service part of repository
   */
  async create(): Promise<IAnime> {
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

      title_en: '',
      title_ja: '',
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
    await document.save();

    Logger.info(`[AnimeRepository]: New document has been created! [id: ${id}]`);
    this._doc = document;

    return DocumentDTO.anime(payload, true);
  }
}



const AnimeRepository = new AnimeRepositoryClass();

export default AnimeRepository;
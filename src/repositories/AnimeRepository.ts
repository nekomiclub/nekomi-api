import AnimeValidators from '~/utils/validators/anime-validators';
import DocumentDTO from '~/service/DataTransferService';
import IAnime, { ANIME_GENRE, ANIME_RATING, ANIME_SEASON, ANIME_STATUS, ANIME_TYPE, IAnimeSchedule } from '~/intf/IAnime';
import Logger from '~/service/LoggerService';
import UnifiedRepositoryClass from './UnifiedRepository';
import conf from '~/config';
import createId from '~/utils/create-id';
import createSlug from '~/utils/create-slug';
import mongoose, { Schema } from 'mongoose';
import { NekoError } from '~/service/ExceptionService';
import { RepositoryQueriesType } from '~/intf/types';
import { getUTC, trimString } from '~/utils/utils';



/** Repository type. Reffers to the model interface */
type RepositoryType = IAnime;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ id: query }, { slug: query }] };
};



const schema = new Schema<RepositoryType>({
  id: String,
  mal_id: Number,
  imdb_id: String,
  slug: String,
  hikka_slug: String,

  hero_poster: String,
  hero_poster_author: String,
  posters: Schema.Types.Mixed,

  year: Number,
  episodes_total: Number,
  episodes_released: Number,

  title_en: String,
  title_ja: String,
  title_ua: String,
  title_synonims: Schema.Types.Mixed,

  synopsis_en: String,
  synopsis_ua: String,

  score: Number,
  scored_by: Number,

  related: Schema.Types.Mixed,
  studios: Schema.Types.Mixed,
  pictures: Schema.Types.Mixed,
  schedule: Schema.Types.Mixed,
  episodes: Schema.Types.Mixed,
  episodes_meta: Schema.Types.Mixed,

  genres: Schema.Types.Mixed,
  rating: String,
  status: String,
  season: String,
  type: String,

  updated_at: String,
  created_at: String,
  hikka_sync: String,
  myanimelist_sync: String,
  shikimori_sync: String,

  is_DMCA_restricted: Boolean,
}, { strict: false });

const model = mongoose.model<RepositoryType>('anime', schema);



interface IConstructorProps {
  testmode?: boolean
}

interface ISetSlugOptions {
  /** @testmode */
  _documentExist?: boolean
}



interface ICreateProps {
  /** Save the document in the database. @default true */
  saveDocument?: boolean
}

interface ISetTitleProps {
  title_en?: string
  title_ja?: string
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
  private testmode = false;

  constructor(query?: string, props?: IConstructorProps) {
    super(model, queries, query);

    if (props?.testmode) this.testmode = props.testmode;
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

    const id = this.testmode ? `~testing-${createId()}` : createId();
    const title = `Untitled ${id.toLowerCase()}`;
    const slug = createSlug(title);



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

      related: [],
      studios: [],
      pictures: [],
      schedule: [],
      episodes: [],
      episodes_meta: [],

      genres: [],
      rating: ANIME_RATING.G,
      status: ANIME_STATUS.ANNOUNCED,
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
  async setMalId(id: number | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (id === null || id < 0) id = null;

    this.set('mal_id', id);
  }



  /**
   * Set IMDB id
   * 
   * @tested
   */
  async setIMDBId(id: string | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (id === null || !id.length) id = null;

    this.set('imdb_id', id);
  }



  /** 
   * Set slug
   *
   * @returns accepted slug (if slug was occupied, will append it to it) 
   * @tested
   */
  async setSlug(slug: string, opts?: ISetSlugOptions): Promise<string> {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    let isDocumentExist = false;
    slug = createSlug(trimString(slug));

    // Define is document exist
    if (this.testmode) {
      isDocumentExist = Boolean(opts?._documentExist);
    } else {
      const exist = await this.safeGetOne(slug);

      // Ensure that slug is unique. Otherwise append id
      if (exist && exist.id !== this._doc.id) isDocumentExist = true;
    }

    if (isDocumentExist) slug += `-${createId(4)}`;

    this.set('slug', slug);

    return slug;
  }



  /** 
   * Set hikka.io slug
   * 
   * @tested
   */
  async setHikkaSlug(slug: string | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (slug === null || !slug.length) slug = null;

    this.set('hikka_slug', slug);
  }



  /**
   * Set year
   * 
   * @testing
   */
  setYear(year: number) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    this.set('year', year);
  }



  /**
   * Set episodes total
   * 
   * @testing
   */
  setEpisodesTotal(episodes: number | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (episodes === 0) episodes = null;

    this.set('episodes_total', episodes);
  }



  /**
   * Set episodes released
   * 
   * @testing
   */
  setEpisodesReleased(episodes: number | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (episodes === 0) episodes = null;

    this.set('episodes_released', episodes);
  }



  /**
   * Set hero poster author
   * 
   * @tested
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
   * @tested
   */
  async setTitle({ synonyms, title_en, title_ja, title_ua }: ISetTitleProps) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (title_en) {
      title_en = trimString(title_en);

      AnimeValidators.title.parse(title_en);

      // Update slug on english title update
      await this.setSlug(title_en);
      this.set('title_en', title_en);
    }

    if (title_ja) {
      title_ja = trimString(title_ja);

      AnimeValidators.title.parse(title_ja);

      this.set('title_ja', title_ja);
    }

    if (title_ua !== undefined || title_ua === null) {
      if (!title_ua?.length) title_ua = null;

      if (title_ua) {
        title_ua = trimString(title_ua);

        AnimeValidators.title.parse(title_ua);
      }

      this.set('title_ua', title_ua);
    }

    if (synonyms?.length) {
      synonyms = synonyms.map(synonym => trimString(synonym));

      AnimeValidators.titleSynonims.parse(synonyms);

      this.set('title_synonims', synonyms);
    }
  }



  /**
   * Set synopsis
   * 
   * @tested
   */
  setSynopsis({ synopsis_en, synopsis_ua }: ISetSynopsisProps) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (synopsis_en || synopsis_en === null) {
      if (synopsis_en) {
        synopsis_en = trimString(synopsis_en);

        AnimeValidators.synopsis.parse(synopsis_en);
      }

      this.set('synopsis_en', synopsis_en);
    }

    if (synopsis_ua || synopsis_ua === null) {
      if (synopsis_ua) {
        synopsis_ua = trimString(synopsis_ua);

        AnimeValidators.synopsis.parse(synopsis_ua);
      }

      this.set('synopsis_ua', synopsis_ua);
    }
  }



  /**
   * Set score & scored by
   * 
   * @tested
   */
  setScore({ score, scoredBy }: ISetScoreProps) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (score) {
      AnimeValidators.score.parse(score);

      this.set('score', Number(score.toFixed(2)));
    }

    if (scoredBy) {
      AnimeValidators.scoredBy.parse(scoredBy);

      this.set('scored_by', Number(scoredBy.toFixed(0)));
    }
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
   * @tested
   */
  setRelated(related: string[] | null) {
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
   * @tested
   */
  setStudios(studios: string[] | null) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    if (studios === null) studios = [];

    this.set('studios', studios);
  }



  /**
   * Set schedule
   * 
   * @tested
   */
  setSchedule(schedule: IAnimeSchedule[]) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    this.set('schedule', schedule);
  }



  /**
   * Set genres
   * 
   * @tested
   */
  setGenres(genres: ANIME_GENRE[]) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    this.set('genres', genres);
  }



  /**
   * Set rating
   * 
   * @tested
   */
  setRating = (rating: ANIME_RATING) => this.setTypedValue(rating, 'rating');

  /** Parse string to type value */
  parseRating = (rating: string) => this.parseStringToType(rating, ANIME_RATING);



  /**
   * Set status
   * 
   * @testing
   */
  setStatus = (status: ANIME_STATUS) => this.setTypedValue(status, 'status');

  /** Parse string to type value */
  parseStatus = (status: string) => this.parseStringToType(status, ANIME_STATUS);



  /**
   * Set season
   * 
   * @tested
   */
  setSeason = (season: ANIME_SEASON) => this.setTypedValue(season, 'season');

  /** Parse string to type value */
  parseSeason = (season: string) => this.parseStringToType(season, ANIME_SEASON);



  /**
   * Set type
   * 
   * @tested
   */
  setType = (type: ANIME_TYPE) => this.setTypedValue(type, 'type');

  /** Parse string to type value */
  parseType = (type: string) => this.parseStringToType(type, ANIME_TYPE);



  /**
   * Set is DMCA restricted
   * 
   * @tested
   */
  setIsDMCARestcited(flag: boolean) {
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



  // /**
  //  * Edit episode meta
  //  * 
  //  * @returns IAnimeEpisodeMeta
  //  * @todo
  //  */
  // async editEpisodeMeta(meta: IAnimeEpisodeMeta): Promise<IAnimeEpisodeMeta> {
  //   throw new NekoError('ERROR_NOT_IMPLEMENTED');
  // }



  // /**
  //  * Remove episode meta
  //  * 
  //  * @todo
  //  */
  // async removeEpisodeMeta(order: number) {
  //   throw new NekoError('ERROR_NOT_IMPLEMENTED');
  // }



  // /**
  //  * Upload hero poster
  //  * 
  //  * @returns hero poster id
  //  * @todo
  //  */
  // async uploadHeroPoster(file: File): Promise<string> {
  //   throw new NekoError('ERROR_NOT_IMPLEMENTED');
  // }



  // /**
  //  * Upload anime picture
  //  * 
  //  * @returns picture id
  //  * @todo
  //  */
  // async uploadPicture(file: File): Promise<string> {
  //   throw new NekoError('ERROR_NOT_IMPLEMENTED');
  // }



  // /**
  //  * Remove picture
  //  * 
  //  * @todo
  //  */
  // async removePicture(id: string) {
  //   throw new NekoError('ERROR_NOT_IMPLEMENTED');
  // }



  /** 
   * Parse string value to enum type
   * 
   * @param value string value to be parsed
   * @param list object to parse
   */
  parseStringToType<E>(value: string, list: object): E {
    for (const key in list) {
      if (list[key] === value) return list[key];
    }

    throw new NekoError('ERROR_TYPE_INVALID', `Cannot parse ${value} to listed type`);
  }



  /** 
   * Set typed value (rate, media, etc)
   * 
   * @param value typed value
   * @param key document key
   */
  protected setTypedValue(value: string, key: keyof Pick<IAnime, 'rating' | 'type' | 'status' | 'season'>) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    this.set(key, value as any);
  }
}



const AnimeRepository = new AnimeRepositoryClass();

export default AnimeRepository;
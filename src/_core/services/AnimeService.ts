import Anime, { ANIME_GENRE, ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_SEASON, ANIME_STATUS, AnimeBroadcast, AnimeEpisode, AnimeStudio } from '~/core/interfaces/Anime.intf';
import AnimeModel from '~/core/models/AnimeModel';
import DubberService from './DubberService';
import NekomiUploadsAPI from './API/NekomiUploads.api';
import Search from '~/services/SearchService';
import User from '~/core/interfaces/User.intf';
import createID, { createUUID } from '~/utils/create-id';
import getUTC from '~/utils/get-utc';
import trimString from '~/utils/trim-string';
import validator from 'validator';
import { AnimeEpisodeQualityType } from '~/core/interfaces/API/NekomiUploadsAPI';
import { DevelopmentMode, TestMode, config } from '~/config';
import { E400, E403, E404, ERR_ALREADY_EXIST, ERR_LENGTH_INVALID, ERR_NO_DOCUMENT, ERR_TYPE_INVALID } from '~/services/ErrorService';
import { HydratedDocument } from 'mongoose';
import { INotifyAiringStarted, INotifyNewEpisode, MyAnimeListNodeFieldType, ServiceControls } from '~/core/interfaces/types';
import { Logger } from '~/services/LoggerService';
import { MALAPI } from './API/MAL.api';
import { MALGenres, MALStudios } from '~/utils/mal-mappers';
import { MongoDocumentDTO } from './DTO';
import { Notify } from '~/services/NotifyService';
import { createSlug } from '~/utils/create-slug';
import { parseRoles } from '~/models/Role';



interface AnimeCreateProps {
  nameEng: string

  /** Save the document. @default true */
  savedoc?: boolean
}

interface AnimePutPosterProps {
  user: User
}

interface AnimePutPoster {
  url: string

  /** Testing flag that says that old poster has been deleted */
  oldPosterRemoved?: boolean
}

interface AnimeDeleteEpisode {
  /** Testing flag that says that episode has been deleted */
  episodeDeleted?: boolean
}

interface AnimeUploadEpisodeProps {
  dubberId: string
  order: number
  qualities: AnimeEpisodeQualityType[]
  user: User
}

interface AnimeUploadEpisode {
  episode: AnimeEpisode

  airingStartedNotifySent?: boolean
  newEpisodeNotifySent?: boolean
}

interface AnimeDeleteEpisodeProps {
  dubberId: string
  order: number
  user: User
}

type AnimeModelControlsType = ServiceControls<AnimeCreateProps, Anime>



export const ERR_NAME_LENGTH_INVALID = new E400(`English name must be between ${config.VALIDATION.PatchTitle.minNameLength} and ${config.VALIDATION.PatchTitle.maxNameLength} symbols length`, 'anime:name_length_invalid');



class AnimeModelControls implements AnimeModelControlsType {
  async create({ nameEng, savedoc }: AnimeCreateProps): Promise<Anime> {
    savedoc = savedoc ?? true;
    nameEng = trimString(nameEng);

    // Validate eng name length
    if (!validator.isLength(nameEng, { min: config.VALIDATION.PatchTitle.minNameLength, max: config.VALIDATION.PatchTitle.maxNameLength })) throw ERR_NAME_LENGTH_INVALID;

    const uuid = TestMode ? `~test-${createUUID()}` : createUUID();
    let slug = createSlug(nameEng);

    const exist = await AnimeModel.findOne({ slug });
    if (exist) slug += `-${createID(3)}`; // Make unique slug if slug by name is occupied



    const instance: Anime = {
      uuid,
      slug,

      names: {
        ukr: nameEng,
        eng: nameEng,
        alt: []
      },

      score: {
        imdb: null,
        mal: null,
        malScoredBy: null
      },

      stopSync: {
        mal: false,
        anidb: false,
        shikimori: false
      },

      media: ANIME_MEDIA_TYPE.UNKNOWN,
      rate: ANIME_RATE.G,
      season: ANIME_SEASON.SPRING,
      status: ANIME_STATUS.FINISHED_AIRING,
      year: getUTC().year,
      updatedAt: getUTC().timestamp,
      createdAt: getUTC().timestamp,
      anidbSyncedAt: getUTC().timestamp,
      hikkaSyncedAt: getUTC().timestamp,
      shikimoriSyncedAt: getUTC().timestamp,
      poster: config.vars.defaultPoster,

      posterAdapt: null,
      broadcast: null,
      description: null,
      details: null,
      episodesCount: null,
      malId: null,
      malSyncedAt: null,

      studios: [],
      related: [],
      pictures: [],
      genres: [],
      episodes: [],
      episodesMeta: [],
    };

    const document = new AnimeModel(instance);

    if (savedoc) {
      await document.save();

      await Search.update('anime');

      Logger.info(`[AnimeService]: New document has been created. [uuid: ${uuid}]`);
    } else {
      Logger.info(`[AnimeService]: New document has been created, but not saved. [uuid: ${uuid}]`);
    }

    return instance;
  }

  async deleteOne(uuid: string): Promise<void> {
    await AnimeModel.deleteOne({ uuid });
    await Search.update('anime');

    Logger.info(`[AnimeService]: Single document has been deleted. [uuid: ${uuid}]`);
  }

  async deleteMany(uuid: string): Promise<void> {
    await Search.update('anime');
    const details = await AnimeModel.deleteMany({ uuid });

    Logger.info(`[AnimeService]: Many (${details.deletedCount}) documents have been deleted. [uuid: ${uuid}]`);
  }

  async getAll(details?: boolean): Promise<Anime[]> {
    const total = await AnimeModel.find();
    const list = total.map(document => new MongoDocumentDTO().anime({ document, details }));

    return list;
  }

  async getById(uuid: string, details?: boolean): Promise<Anime> {
    const document = await AnimeModel.findOne({ uuid });
    if (!document) throw new E404(`Anime by uuid (${uuid}) is not found`);

    return new MongoDocumentDTO().anime({ document, details });
  }

  async getByQuery(query: string, details?: boolean): Promise<Anime> {
    const queryArr = [{ uuid: query }, { slug: query }];

    // @ts-expect-error Query can be stringified number, parse it if not NaN
    if (!isNaN(+query)) queryArr.push({ malId: +query });

    const document = await AnimeModel.findOne({ $or: queryArr });
    if (!document) throw new E404(`Anime by query (${query}) is not found`);

    return new MongoDocumentDTO().anime({ document, details });
  }

  async safeGetByQuery(query: string, details?: boolean): Promise<Anime | null> {
    try {
      return await this.getByQuery(query, details);
    } catch (e) { return null; }
  }
}



export class AnimeService extends AnimeModelControls {
  /** TO GET ANIME OBJECT USE get.anime INSTEAD. THIS IS PRIVATE OBJECT */
  readonly document: HydratedDocument<Anime> | null = null;
  private stack: string[] = [];

  /** Anime validation config */
  private _vl = config.VALIDATION.Anime;



  async init(query: string) {
    const queryArr = [{ uuid: query }, { slug: query }];

    // @ts-expect-error Query can be stringified number, parse it if not NaN
    if (!isNaN(+query)) queryArr.push({ malId: +query });

    const document = await AnimeModel.findOne({ $or: queryArr }); // Hydrated document required, find by built-in method is not possible
    if (!document) throw new E404(`Document with query (${query}) is not found`);

    // @ts-expect-error Ignore readonly
    this.document = document;
  }

  /** Save the document
   * @returns current patch stack
   */
  async save(): Promise<string[]> {
    if (!this.document) throw ERR_NO_DOCUMENT;

    this.document.updatedAt = getUTC().timestamp;
    this.document.markModified('updatedAt');

    try {
      await this.document.save();
    } catch (error) {
      Logger.debug(`[AnimeService]: Cannot save the document. Retrying after 1 second...`);

      await new Promise(res => {
        setTimeout(() => {
          res(1);
        }, 1000);
      });

      try {
        await this.document.save();
      } catch (e) {
        Logger.error(`[AnimeService]: Cannot save the document`, e);

        const stack = this.stack;
        this.stack = [];

        return stack;
      }
    }

    Logger.debug(`[AnimeService]: Document patched. [uuid: ${this.document.uuid}; changes: ${this.stack.length ? this.stack.join(', ') : 'none'}]`);

    const stack = this.stack;
    this.stack = [];

    return stack;
  }

  get anime(): Anime {
    if (!this.document) throw ERR_NO_DOCUMENT;
    return new MongoDocumentDTO().anime({ document: this.document, details: true });
  }



  /**  
   * Set malId. Value can be null
   * 
   * @tested  
  */
  setMalId(malId: number | null) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('malId');

    if (malId === null || malId < 0) {
      this.stack.push(`MalID deleted`);

      this.document.malId = null;

      return;
    }

    this.stack.push(`Changed malId (${this.document.malId} > ${malId})`);

    this.document.malId = malId;
  }



  /** 
   * Set description. Zero-length value will set as null
   * 
   * @tested 
   */
  setDescription(description: string | null) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('description');

    if (description === null || description.length === 0) {
      this.stack.push(`Description removed`);

      this.document.description = null;
      return;
    }

    description = trimString(description);

    if (!validator.isLength(description, { max: this._vl.maxDescriptionLength })) throw new ERR_LENGTH_INVALID(`Description length is too long`);

    this.stack.push(`Description changed (${this.document.description?.length} > ${description.length})`);

    this.document.description = description;
  }



  /** 
   * Set details. Zero-length value will set as null
   * 
   * @tested 
   */
  setDetails(details: string | null) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('details');

    if (details === null || details.length === 0) {
      this.stack.push(`Details removed`);

      this.document.details = null;
      return;
    }

    details = trimString(details);

    if (!validator.isLength(details, { max: this._vl.maxDetailsLength })) throw new ERR_LENGTH_INVALID(`Details length is too long`);

    this.stack.push(`Details changed (${this.document.details?.length} > ${details.length})`);

    this.document.details = details;
  }



  /**
   * Set episodes count. Value 0 will set as null
   * 
   * @tested 
   */
  setEpisodesCount(episodesCount: number | null) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('episodesCount');

    if (episodesCount === null || episodesCount <= 0) {
      this.stack.push(`Episodes count deleted`);

      this.document.episodesCount = null;

      return;
    }

    if (episodesCount > this._vl.maxEpisodesCount) throw new ERR_LENGTH_INVALID(`Episodes count are too much`);

    this.stack.push(`Episodes count changed (${this.document.episodesCount} > ${episodesCount})`);
    this.document.episodesCount = episodesCount;
  }



  /**
   * Set year
   * 
   * @tested 
   */
  setYear(year: number) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('year');

    if (year < this._vl.minYear || year > this._vl.maxYear) throw new ERR_LENGTH_INVALID(`Year is out of range`);

    this.stack.push(`Year changed (${this.document.year} > ${year})`);
    this.document.year = year;
  }



  /**
   * Should set rate
   * 
   * @tested 
   */
  setRate = (rate: ANIME_RATE) => this.setTypedValue<ANIME_RATE>(rate, 'rate');

  /** Parse string to rate type */
  parseRate = (rate: string) => this.parseStringToType<ANIME_RATE>(rate, ANIME_RATE);



  /**
   * Set status
   * 
   * @tested 
   */
  setStatus = (status: ANIME_STATUS) => this.setTypedValue<ANIME_STATUS>(status, 'status');

  /** Parse string to status type */
  parseStatus = (status: string) => this.parseStringToType<ANIME_STATUS>(status, ANIME_STATUS);



  /**
   * Set season
   * 
   * @tested 
   */
  setSeason = (season: ANIME_SEASON) => this.setTypedValue<ANIME_SEASON>(season, 'season');

  /** Parse string to season type */
  parseSeason = (season: string) => this.parseStringToType<ANIME_SEASON>(season, ANIME_SEASON);



  /**
   * Set media
   * 
   * @tested 
   */
  setMedia = (media: ANIME_MEDIA_TYPE) => this.setTypedValue<ANIME_MEDIA_TYPE>(media, 'media');

  /** Parse string to media type */
  parseMedia = (media: string) => this.parseStringToType<ANIME_MEDIA_TYPE>(media, ANIME_MEDIA_TYPE);



  /**
   * Set names
   * English name will change the slug
   * 
   * @tested
   */
  async setNames({ alt, eng, ukr }: Partial<Anime['names']>) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('names');
    this.document.markModified('slug');

    if (eng !== undefined) {
      eng = trimString(eng);
      if (!validator.isLength(eng, { max: this._vl.maxNameLength })) throw new ERR_LENGTH_INVALID(`Eng name length is too large`);

      this.stack.push(`Eng name changed (${this.document.names.eng} > ${eng})`);
      this.document.names.eng = eng;

      // Change slug
      let slug = createSlug(eng);

      const exist = await new AnimeService().safeGetByQuery(slug);
      if (exist && exist.uuid !== this.document.uuid) slug += `-${createID(3)}`;

      this.stack.push(`Slug changed (${this.document.slug} > ${slug})`);
      this.document.slug = slug;
    }

    if (ukr !== undefined) {
      ukr = trimString(ukr);
      if (!validator.isLength(ukr, { max: this._vl.maxNameLength })) throw new ERR_LENGTH_INVALID(`Ukr name length is too large`);

      this.stack.push(`Ukr name changed (${this.document.names.ukr} > ${ukr})`);
      this.document.names.ukr = ukr;
    }

    if (alt !== undefined) {
      if (alt.length > this._vl.maxAltNamesLength) throw new ERR_LENGTH_INVALID(`Alt names length is too large`);

      alt = alt.map(name => {
        name = trimString(name);
        if (!validator.isLength(name, { max: this._vl.maxNameLength })) throw new ERR_LENGTH_INVALID(`Alt name length is too large`);

        return name;
      });

      this.stack.push(`Alt names changed (${this.document?.names.alt.length} > ${alt.length})`);
      this.document.names.alt = alt;
    }
  }



  /**
   * Set stop sync flags
   * 
   * @tested
   */
  setStopSync({ mal, shikimori, anidb }: Partial<Anime['stopSync']>) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('stopSync');

    if (mal !== undefined) {
      this.stack.push(`Mal StopSync changed (${this.document.stopSync.mal} > ${mal})`);

      this.document.stopSync.mal = mal;
    }

    if (shikimori !== undefined) {
      this.stack.push(`Shikimori StopSync changed (${this.document.stopSync.shikimori} > ${shikimori})`);

      this.document.stopSync.shikimori = shikimori;
    }

    if (anidb !== undefined) {
      this.stack.push(`AniDB StopSync changed (${this.document.stopSync.anidb} > ${anidb})`);

      this.document.stopSync.anidb = anidb;
    }
  }




  /** 
   * Set poster adapted by dubber
   * 
   * @tested
   */
  async setPosterAdapt(dubberId: Anime['posterAdapt']) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('posterAdapt');

    if (dubberId === null) {
      this.stack.push(`Poster adapt removed`);
      this.document.posterAdapt = null;

      return;
    }

    await new DubberService().getById(dubberId);
    this.stack.push(`Poster adapt changed (${this.document.posterAdapt} > ${dubberId})`);
    this.document.posterAdapt = dubberId;
  }



  /**
   * Set score & malScoredBy
   * Score can be null
   * 
   * @tested
   */
  setScore({ imdb, mal, malScoredBy }: Partial<Anime['score']>) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('score');

    if (imdb !== undefined) {
      if (imdb === null || imdb === 0) {
        this.document.score.imdb = null;
        this.stack.push(`IMDB score removed`);

        return;
      }

      if (imdb > this._vl.maxScore || imdb < 0) throw new ERR_LENGTH_INVALID(`IMDB score is out of range`);

      this.stack.push(`IMDB score updated (${this.document.score.imdb} > ${imdb})`);
      this.document.score.imdb = imdb;
    }

    if (mal !== undefined) {
      if (mal === null || mal === 0) {
        this.document.score.mal = null;
        this.stack.push(`MAL score removed`);

        return;
      }

      if (mal > this._vl.maxScore || mal < 0) throw new ERR_LENGTH_INVALID(`MAL score is out of range`);

      this.stack.push(`MAL score updated (${this.document.score.mal} > ${mal})`);
      this.document.score.mal = mal;
    }

    if (malScoredBy !== undefined) {
      if (malScoredBy === null || malScoredBy === 0) {
        this.document.score.malScoredBy = null;
        this.stack.push(`MAL scored by removed`);

        return;
      }

      this.stack.push(`MAL scored by updated (${this.document.score.malScoredBy} > ${malScoredBy})`);
      this.document.score.malScoredBy = malScoredBy;
    }
  }



  /** 
   * Set studios.
   * 
   * @tested
   */
  async setStudios(studios: AnimeStudio[]) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('studios');

    if (studios.length > config.VALIDATION.PatchTitle.maxStudioLength) throw new ERR_LENGTH_INVALID(`Studios are too many`);

    const newStudios: AnimeStudio[] = studios.map(el => {
      let { malId, name } = el;

      name = trimString(name);

      if (!validator.isLength(name, { max: config.VALIDATION.CreateUser.maxNameLength })) throw new ERR_LENGTH_INVALID(`Studio ${name} length is too long`);

      return {
        malId,
        name
      };
    });


    this.stack.push(`Studios changed (${this.document.studios.map(el => el.name).join(', ')} > ${newStudios.map(el => el.name).join(', ')})`);
    this.document.studios = newStudios;
  }



  /** 
   * Set genres
   * 
   * @tested
   */
  setGenres(genres: ANIME_GENRE[]) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('genres');

    if (genres.length > this._vl.maxGenresLength) throw new ERR_LENGTH_INVALID(`Genres length is out of range`);

    this.stack.push(`Genres changed (${this.anime.genres.join(', ')} > ${genres.join(', ')})`);
    this.document.genres = genres;
  }

  /** Parse genres from string array */
  parseGenres(genres: string[]): ANIME_GENRE[] {
    const output: ANIME_GENRE[] = [];

    genres.forEach(genre => {
      const slug = createSlug(trimString(genre)).replaceAll('-', '_') as ANIME_GENRE;

      if (Object.values(ANIME_GENRE).includes(slug)) output.push(slug);
    });

    return output;
  }



  /** 
   * Set broadcast timing
   * 
   * @tested
   */
  setBroadcast(broadcast: AnimeBroadcast) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('broadcast');

    this.stack.push(`Broadcast changed (${this.document.broadcast ? `${this.document.broadcast?.day} ${this.document.broadcast?.time}` : 'null'} > ${broadcast.day} ${broadcast.time})`);
    this.document.broadcast = broadcast;
  }



  /**
   * Find related anime documents by mal ids
   * 
   * @tested
   */
  async setRelated(malIds: number[]) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('related');

    if (!malIds.length) {
      this.stack.push(`Related anime removed`);
      this.document.related = [];

      return;
    }

    const documents = await AnimeModel.find({ malId: { $in: malIds } });
    const related = documents.map(el => el.uuid);

    this.stack.push(`Related changed (${this.document.related.join(', ')} > ${related.join(', ')})`);
    this.document.related = related;
  }



  /** 
   * Sync anime details with myanimelist
   * Will save the document
   * 
   * @requires malId specified
   * 
   * @param force will skip stopsync check
   * @returns parse state (parsed/not)
   * 
   * @tested
   */
  async syncWithMyAnimeList(force?: boolean): Promise<boolean> {
    if (!this.document) throw ERR_NO_DOCUMENT;
    if (this.document.malId === null) return false;

    if (!force) {
      if (this.document.stopSync?.mal) return false; // Check if sync is not prevented
      if (getUTC().timestamp < Number(this.document.malSyncedAt) + config.vars.MyAnimeListSyncTimeout) return false; // Check if last sync timed out
    }

    // Pass in test mode
    if (TestMode) return true;

    const fields: MyAnimeListNodeFieldType[] = [
      'broadcast',
      'genres',
      'media_type',
      'num_episodes',
      'status',
      'studios',
      'related_anime',
      'rating',
      'num_scoring_users',
      'mean',
      'alternative_titles'
    ];

    try {
      const node = await MALAPI.getAnime({ id: this.document.malId, fields });



      if (node.alternative_titles?.en && this.document.names.eng !== node.alternative_titles?.en) this.setNames({ eng: node.alternative_titles?.en });
      if (node.mean && node.mean !== this.document.score.mal) this.setScore({ mal: node.mean });
      if (node.num_scoring_users && node.num_scoring_users !== this.document.score.malScoredBy) this.setScore({ malScoredBy: node.num_scoring_users });
      if (node.num_episodes && node.num_episodes !== this.document.episodesCount) this.setEpisodesCount(node.num_episodes);
      if (node.rating && node.rating !== this.document.rate) this.setRate(node.rating);
      if (node.status && node.status !== this.document.status) this.setStatus(node.status);
      if (node.media_type && node.media_type !== this.document.media) this.setMedia(node.media_type);

      if (node.genres) this.setGenres(MALGenres(node.genres));
      if (node.broadcast) this.setBroadcast({ day: node.broadcast.day_of_the_week, time: node.broadcast.start_time });
      if (node.studios) await this.setStudios(MALStudios(node.studios));
      if (node.related_anime) await this.setRelated(node.related_anime.map(el => el.node.id));

      // Update poster
      if (!this.document.poster.includes(config.DOMAIN.nekomi_media) || this.document.poster === config.vars.defaultPoster) {
        this.document.poster = node.main_picture.large;
        this.document.markModified('poster');
      }



      this.document.malSyncedAt = getUTC().timestamp;
      this.document.markModified('malSyncedAt');

      await this.save();
      await Search.update('anime');

      Logger.info(`[AnimeService]: Anime synced with myanimelist. [uuid: ${this.document.uuid}; malId: ${this.document.malId}]`);
      return true;
    } catch (e) {
      Logger.fail(`[AnimeService]: Cannot sync with myanimelist`, e);
      return false;
    }
  }



  /**
   * Sync anime episode descriptions
   * Will save the document
   * 
   * @requires malId specified
   * 
   * @param force will skip stopsync check
   * @returns parse state (parsed/not)
   * 
   * @todo
   */
  async syncWithAniDB(force?: boolean): Promise<boolean> {
    return false;

    // if (!this.document) throw ERR_NO_DOCUMENT;
    // if (this.document.malId === null) return false;

    // if (!force) {
    //   if (this.document.stopSync.anidb) return false; // Check if anidb sync not prevented
    // }

    // try {
    //   Logger.info(`[AnimeService]: Anime synced with anidb. [uuid: ${this.document.uuid}; malId: ${this.document.malId}]`);

    //   return true;
    // } catch (e) {
    //   Logger.fail(`[AnimeService]: Cannot sync with anidb`, e);

    //   return false;
    // }
  }



  /**
   * Sync anime photos with shikimori
   * 
   * @requires malId specified
   * 
   * @param force will skip stopsync check
   * @returns parse state (parsed/not)
   * 
   * @todo
   */
  async syncWithShikimori(force?: boolean): Promise<boolean> {
    return false;

    // if (!this.document) throw ERR_NO_DOCUMENT;
    // if (this.document.malId === null) return false;

    // if (!force) {
    //   if (this.document.stopSync.shikimori) return false; // Check if shikimori sync not prevented
    // }

    // try {
    //   Logger.info(`[AnimeService]: Anime synced with shikimori. [uuid: ${this.document.uuid}; malId: ${this.document.malId}]`);

    //   return true;
    // } catch (e) {
    //   Logger.fail(`[AnimeService]: Cannot sync with shikimori`, e);

    //   return false;
    // }
  }



  /**
   * Replace old poster with new one
   * Will save the document
   * 
   * @access titleEdit
   * @tested 
   */
  async putPoster(file: Express.Multer.File, { user }: AnimePutPosterProps): Promise<AnimePutPoster> {
    if (!this.document) throw ERR_NO_DOCUMENT;

    const capabilities = await parseRoles(user.roles);
    if (!capabilities.includes('root') && !capabilities.includes('titleEdit')) throw new E403;

    const oldPosterId = NekomiUploadsAPI.getUploadIdFromURL(this.document.poster);
    const oldPosterURL = this.document.poster;
    let newUploadId: string | null = null;
    let newUploadURL: string | null = null;



    // Upload new poster
    if (!TestMode) {
      const res = await NekomiUploadsAPI.uploadFile({ file, type: 'photo/title/poster', uploadedById: user.id });

      newUploadId = res.id;
      newUploadURL = res.url;
    } else {
      newUploadId = createUUID();
      newUploadURL = `${config.URL.nekomi_media}/${newUploadId}`;
    }

    const returnPayload: AnimePutPoster = {
      url: newUploadURL
    };



    // Save new poster
    this.stack.push(`Poster changed (id: ${oldPosterId} > ${newUploadId})`);
    Logger.info(`[AnimeService/${this.document.uuid}]: Poster changed. [id: ${newUploadId}; by: ${user.id}]`);

    this.document.poster = newUploadURL;
    this.document.markModified('poster');

    await this.save();



    // Remove old poster only if it is on nekomi and not default
    const uploadsOrigin = DevelopmentMode ? '127.0.0.1' : config.DOMAIN.nekomi;
    if (oldPosterURL.match(uploadsOrigin) && oldPosterURL !== config.vars.defaultPoster) {
      if (!TestMode) {
        try {
          await NekomiUploadsAPI.deleteUpload({ id: oldPosterId, deletedById: user.id });
          Logger.info(`[AnimeSerivce/${this.document.uuid}]: Old anime poster removed. [id: ${oldPosterId}; by: ${user.id}]`);
        } catch (e) {
          Logger.fail(`[AnimeService/${this.document.uuid}]: Failed remove old anime poster. [id: ${oldPosterId}]`);
        }
      }

      // Set flag that poster has been deleted
      returnPayload.oldPosterRemoved = true;
    }

    return returnPayload;
  }



  /** 
   * Upload new anime episode
   * Dubber member can upload episode only in own dubbing
   * Will save the document
   * 
   * @access seriesAdd
   * @todo test
   */
  async uploadEpisode(file: Express.Multer.File, { dubberId, order, qualities, user }: AnimeUploadEpisodeProps): Promise<AnimeUploadEpisode> {
    if (!this.document) throw ERR_NO_DOCUMENT;

    const capabilities = await parseRoles(user.roles);
    if (!capabilities.includes('root') && !capabilities.includes('seriesAdd')) throw new E403;
    if (!capabilities.includes('root') && user.statistics.dubber_team_member !== dubberId) throw new E403(`User cannot upload episodes in other dubs`);
    if (!capabilities.includes('root') && !capabilities.includes('admin') && qualities.includes(2160)) throw new E403(`Only admin can upload 4k anime`);

    if (order > this._vl.maxEpisodesCount || order < 0) throw new E400(`Order is out of range`);
    if (this.document.episodes.some(el => el.dubberID === dubberId && el.order === order)) throw new ERR_ALREADY_EXIST(`Episode already exist`);

    const dubber = await new DubberService().getById(dubberId);

    let episodeId: string | null = null;
    let episodeFrames: number | null = null;

    // Upload episode
    if (!TestMode) {
      const res = await NekomiUploadsAPI.uploadFile({ file, type: 'video/title/episode', uploadedById: user.id, qualities });

      episodeId = res.id;
      episodeFrames = res.frames ?? 0;
    } else {
      episodeId = createUUID();
      episodeFrames = 12;
    }

    const episode: AnimeEpisode = {
      order,
      dubberID: dubberId,
      frames: [],
      qualities: {
        q4k: qualities.includes(2160) ? `${config.URL.nekomi_media}/${episodeId}_q_2160` : null,
        q1080: `${config.URL.nekomi_media}/${episodeId}`,
        q720: qualities.includes(720) ? `${config.URL.nekomi_media}/${episodeId}_q_720` : null,
        q480: qualities.includes(480) ? `${config.URL.nekomi_media}/${episodeId}_q_480` : null,
        q240: qualities.includes(240) ? `${config.URL.nekomi_media}/${episodeId}_q_240` : null
      }
    };

    // Set frames URLs
    let i = 0;

    while (i < episodeFrames) {
      episode.frames.push(`${config.URL.nekomi_media}/${episodeId}_f_${i}`);
      i++;
    }

    // Sort episodes in order
    this.document.episodes.push(episode);
    this.document.episodes.sort((a, b) => a.order - b.order);
    this.document.markModified('episodes');

    const msg = `Episode uploaded. [id: ${episodeId}; order: ${order}; dubberId: ${dubberId}]`;
    this.stack.push(msg);
    Logger.info(`[AnimeService/${this.document.uuid}]: ${msg}`);

    const returnPayload: AnimeUploadEpisode = {
      episode,
    };

    await this.save();

    // Send notifications
    try {
      // Send new_episode
      const notifyNewEpisodePayload: INotifyNewEpisode = {
        dubberID: dubber.id,
        episodeOrder: order,
        titleID: this.document.uuid
      };

      if (!TestMode) {
        Notify.broadcast({
          event: 'new_episode',
          payload: notifyNewEpisodePayload
        });
      }

      returnPayload.newEpisodeNotifySent = true;

      // Send airing_started
      if (this.document.episodes.length === 1) {
        const notifyAiringStartedPayload: INotifyAiringStarted = {
          titleID: this.document.uuid
        };

        if (!TestMode) {
          Notify.broadcast({
            event: 'airing_started',
            payload: notifyAiringStartedPayload
          });
        }

        returnPayload.airingStartedNotifySent = true;
      }
    } catch (e) {
      Logger.fail(`[AnimeService/${this.document.uuid}]: Sent notifications failed`, e);
    }

    return returnPayload;
  }



  /**
   * Delete exist anime episode
   * Dubber member can delete episode only from own dubbing
   * Will save the document
   * 
   * @access seriesDelete
   * @tested
   */
  async deleteEpisode({ dubberId, order, user }: AnimeDeleteEpisodeProps): Promise<AnimeDeleteEpisode> {
    if (!this.document) throw ERR_NO_DOCUMENT;

    const capabilities = await parseRoles(user.roles);
    if (!capabilities.includes('root') && !capabilities.includes('seriesDelete')) throw new E403;
    if (!capabilities.includes('root') && user.statistics.dubber_team_member !== dubberId) throw new E403(`Cannot delete episodes from not own dubbing`);

    const episode = this.document.episodes.find(el => el.dubberID === dubberId && el.order === order);
    if (!episode) {
      if (DevelopmentMode) Logger.fail(`[AnimeService/${this.document.uuid}]: Cannot delete not exist episode`);

      return {};
    }

    const uploadId = NekomiUploadsAPI.getUploadIdFromURL(episode.qualities.q1080);

    // Delete episode
    if (!TestMode) {
      await NekomiUploadsAPI.deleteUpload({ id: uploadId, deletedById: user.id, withChildren: true });
    }

    const msg = `Episode deleted. [id: ${uploadId}; dubberId: ${dubberId}; order: ${order}]`;

    Logger.debug(`[AnimeService/${this.document.uuid}]: ${msg}`);
    this.stack.push(msg);

    this.document.episodes = this.document.episodes.filter(el => !(el.dubberID === dubberId && el.order === order));
    this.document.markModified('episodes');

    await this.save();

    return {
      episodeDeleted: true
    };
  }



  /** 
   * Parse string value to enum type
   * 
   * @param value string value to be parsed
   * @param list enum to parse
   */
  parseStringToType<E>(value: string, list: object): E {
    for (const key in list) {
      if (list[key] === value) return list[key];
    }

    throw new ERR_TYPE_INVALID(`Type (${value}) is invalid`);
  }



  /** 
   * Set typed value (rate, media, etc)
   * 
   * @param value typed value
   * @param key document key
   */
  private setTypedValue<T>(value: T, key: 'rate' | 'media' | 'season' | 'rate' | 'status') {
    if (!this.document) throw ERR_NO_DOCUMENT;

    this.document.markModified(key);

    this.stack.push(`${key} changed (${this.document[key]} > ${value})`);
    (this.document[key] as T) = value;
  }
}



export default AnimeService;
import Anime, { ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_SEASON, ANIME_STATUS, AnimeStudio } from '~/core/interfaces/AnimeIntf';
import AnimeModel from '~/core/models/AnimeModel';
import DubberService from './DubberService';
import NekomiUploadsAPI from './API/NekomiUploadsAPI';
import Search from '~/services/SearchService';
import User from '~/core/interfaces/UserIntf';
import axios from 'axios';
import getUTC from '~/utils/get-utc';
import trimString from '~/utils/trim-string';
import validator from 'validator';
import { AnimeEpisodeQualityType } from '~/core/interfaces/API/NekomiUploadsAPI';
import { E400, E403, E404, ERR_ACCESS_REJECTED, ERR_ALREADY_EXIST, ERR_LENGTH_INVALID, ERR_NO_DOCUMENT } from '~/services/ErrorService';
import { HydratedDocument } from 'mongoose';
import { Logger } from '~/services/LoggerService';
import { MALGenres } from '~/utils/mal-mappers';
import { MongoDocumentDTO } from './DTO';
import { MyAnimeListNode, ServiceControls } from '~/core/interfaces/types';
import { TestMode, config } from '~/config';
import { createSlug } from '~/utils/create-slug';
import { createUUID } from '~/utils/create-id';
import { parseRoles } from '~/models/Role';



interface AnimeCreateProps {
  nameEng: string

  /** Save the document. @default true */
  savedoc?: boolean
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

type AnimeModelControlsType = ServiceControls<AnimeCreateProps, Anime>



export const ERR_NAME_LENGTH_INVALID = new E400(`English name must be between ${config.VALIDATION.PatchTitle.minNameLength} and ${config.VALIDATION.PatchTitle.maxNameLength} symbols length`, 'anime:name_length_invalid');



class AnimeModelControls implements AnimeModelControlsType {
  async create({ nameEng, savedoc }: AnimeCreateProps): Promise<Anime> {
    savedoc = savedoc ?? true;
    nameEng = trimString(nameEng);

    // Validate eng name length
    if (!validator.isLength(nameEng, { min: config.VALIDATION.PatchTitle.minNameLength, max: config.VALIDATION.PatchTitle.maxNameLength })) throw ERR_NAME_LENGTH_INVALID;

    const uuid = TestMode ? `~test-${createUUID()}` : createUUID();
    const slug = createSlug(nameEng);

    const exist = await AnimeModel.findOne({ slug });
    if (exist) throw new ERR_ALREADY_EXIST();



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
        mal: false
      },

      media: ANIME_MEDIA_TYPE.UNKNOWN,
      rate: ANIME_RATE.G,
      season: ANIME_SEASON.SPRING,
      status: ANIME_STATUS.FINISHED_AIRING,
      year: getUTC().year,
      updatedAt: getUTC().timestamp,
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

  async safeGetByQuery(uuid: string, details?: boolean): Promise<Anime | null> {
    try {
      return await this.getById(uuid, details);
    } catch (e) { return null; }
  }

  async getByQuery(query: string, details?: boolean): Promise<Anime> {
    const document = await AnimeModel.findOne({ $or: [{ id: query }, { uuid: query }, { slug: query }, { code: query }, { malId: +query }, { mal_id: query }] });
    if (!document) throw new E404(`Anime by query (${query}) is not found`);

    return new MongoDocumentDTO().anime({ document, details });
  }
}



export class AnimeService extends AnimeModelControls {
  /** TO GET ANIME OBJECT USE get.anime INSTEAD. THIS IS PRIVATE OBJECT */
  readonly document: HydratedDocument<Anime> | null = null;
  private stack: string[] = [];

  /** Anime validation config */
  private _vl = config.VALIDATION.Anime;



  async init(query: string) {
    const document = await AnimeModel.findOne({ $or: [{ uuid: query }, { slug: query }] }); // Hydrated document required, find by built-in method is not possible
    if (!document) throw new E404(`Document with query (${query}) is not found`);

    // @ts-expect-error
    this.document = document;
  }

  /** Save the document
   * @returns current patch stack
   */
  async save(): Promise<string[]> {
    if (!this.document) throw ERR_NO_DOCUMENT;

    await this.document.save();

    Logger.debug(`[AnimeService]: Document patched. [uuid: ${this.document.uuid}; changes: ${this.stack.length ? this.stack.join(', ') : 'none'}]`);

    return this.stack;
  }

  get anime(): Anime {
    if (!this.document) throw ERR_NO_DOCUMENT;
    return new MongoDocumentDTO().anime({ document: this.document, details: true });
  }



  /**  
   * Set malId. Value can be null
   * 
   * @tested 2.1.0 
  */
  async setMalId(malId: number | null) {
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
   * @tested 2.1.0
   */
  async setDescription(description: string | null) {
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
   * @tested 2.1.0
   */
  async setDetails(details: string | null) {
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
   * @tested 2.1.0
   */
  async setEpisodesCount(episodesCount: number | null) {
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
   * @tested 2.1.0
   */
  async setYear(year: number) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('year');

    if (year < this._vl.minYear || year > this._vl.maxYear) throw new ERR_LENGTH_INVALID(`Year is out of range`);

    this.stack.push(`Year changed (${this.document.year} > ${year})`);
    this.document.year = year;
  }



  /**
   * Should set rate
   * 
   * @tested 2.1.0
   */
  async setRate(rate: ANIME_RATE) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('rate');

    this.stack.push(`Rate changed (${this.document.rate} > ${rate})`);
    this.document.rate = rate;
  }



  /**
   * Set status
   * 
   * @tested 2.1.0
   */
  async setStatus(status: ANIME_STATUS) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('status');

    this.stack.push(`Status changed (${this.document.status} > ${status})`);
    this.document.status = status;
  }



  /**
   * Set season
   * 
   * @tested 2.1.0
   */
  async setSeason(season: ANIME_SEASON) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('season');

    this.stack.push(`Season changed (${this.document.season} > ${season})`);
    this.document.season = season;
  }



  /**
   * Set media
   * 
   * @tested 2.1.0
   */
  async setMedia(media: ANIME_MEDIA_TYPE) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('media');

    this.stack.push(`Media changed (${this.document.media} > ${media})`);
    this.document.media = media;
  }

  /**
   * Set names
   * English name will also change the slug
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
      const slug = createSlug(eng);

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
   * @todo
   */
  async setStopSync({ mal, shikimori }: Partial<Anime['stopSync']>) {
    if (mal !== undefined) {

    }

    if (shikimori !== undefined) {

    }
  }




  /** 
   * Set poster adapted by dubber
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
   * Set score
   * 
   * @todo
   */
  async setScore({ imdb, mal, malScoredBy }: Partial<Anime['score']>) {
    if (imdb !== undefined) {

    }

    if (mal !== undefined) {

    }

    if (malScoredBy !== undefined) {

    }
  }



  /** 
   * Set studios
   * 
   * @todo make it normal, with id's
   */
  async setStudios(studios: string[]) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    this.document.markModified('studios');

    if (studios.length > config.VALIDATION.PatchTitle.maxStudioLength) throw new ERR_LENGTH_INVALID(`Studios are too many`);

    const newStudios: AnimeStudio[] = studios.map(name => {
      name = trimString(name);

      if (!validator.isLength(name, { max: config.VALIDATION.CreateUser.maxNameLength })) throw new ERR_LENGTH_INVALID(`Studio ${name} length is too large`);

      return {
        id: '-1',
        name
      };
    });


    this.stack.push(`Studios changed (${this.document.studios.map(el => el.name).join(', ')} > ${newStudios.map(el => el.name).join(', ')})`);
    this.document.studios = newStudios;
  }



  /** 
   * Sync anime details with myanimelist
   * Will save the document
   */
  async syncWithMyAnimeList() {
    if (!this.document) throw ERR_NO_DOCUMENT;
    if (this.anime.stopSync?.mal === true || (typeof this.anime.stopSync.mal === 'number' && this.anime.stopSync.mal < getUTC().timestamp)) return; // Check if sync is not prevented
    if (this.anime.malId === null || getUTC().timestamp < Number(this.anime.malSyncedAt) + config.vars.MyAnimeListSyncTimeout) return; // Check if sync timed out

    const API_ENDPONT = `https://api.myanimelist.net/v2`;
    const fields: (keyof MyAnimeListNode)[] = [
      'broadcast',
      'genres',
      'media_type',
      'num_episodes',
      'status',
      'studios',
      'related_anime',
      'rating',
      'num_scoring_users',
      'mean'
    ];

    try {
      const { data: node } = await axios.get<MyAnimeListNode>(`${API_ENDPONT}/anime/${this.anime.malId}`, {
        headers: {
          'X-MAL-CLIENT-ID': config.env.MALClientID
        },
        params: {
          fields: fields.join(', ')
        }
      });

      this.document.score.mal = node.mean ?? this.document.score.mal;
      this.document.score.malScoredBy = node.num_scoring_users ?? this.document.score.malScoredBy;
      this.document.episodesCount = node.num_episodes ?? this.document.episodesCount;
      this.document.studios = node.studios ?? this.document.studios;

      this.document.rate = node.rating ?? this.document.rate;
      this.document.status = node.status ?? this.document.status;
      this.document.media = node.media_type ?? this.document.media;
      this.document.genres = MALGenres(node.genres) ?? this.document.genres;

      this.document.broadcast = node.broadcast ? {
        day: node.broadcast.day_of_the_week,
        time: node.broadcast.start_time
      } : this.document.broadcast;

      this.document.related = [];
      for (const key in node.related_anime) {
        const el = node.related_anime[key].node;

        try {
          const anime = await new AnimeService().getByQuery(el.id);

          this.document.related.push(anime.uuid);
        } catch (e) { continue; }
      }

      this.document.poster = this.document.poster.includes(config.DOMAIN.nekomi_media) ? this.document.poster : node.main_picture.large;
      this.document.malSyncedAt = getUTC().timestamp;

      await this.save();
      await Search.update('anime');

      Logger.info(`[AnimeService]: Anime synced with myanimelist. [uuid: ${this.document.uuid}; malId: ${this.document.malId}]`);
    } catch (e) {
      return Logger.fail(`[AnimeService]: Cannot sync with myanimelist`, e);
    }
  }



  /**
   * Sync anime photos with shikimori
   * 
   * @todo
   */
  async syncWithShikimori() {

  }



  /**
   * Replace old poster with new one
   * Will save the document
   * 
   * @access titleEdit
   * @tested 2.1.0
   */
  async putPoster(file: Express.Multer.File, user: User): Promise<AnimePutPoster> {
    if (!this.document) throw ERR_NO_DOCUMENT;

    const capabilities = await parseRoles(user.roles);
    if (!capabilities.includes('root') && !capabilities.includes('titleEdit')) throw new ERR_ACCESS_REJECTED();

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
    const uploadsOrigin = TestMode ? '127.0.0.1' : config.DOMAIN.nekomi;
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
   */
  async uploadEpisode(file: Express.Multer.File, dubberId: string, order: number, qualities: AnimeEpisodeQualityType[], user: User) {
    // if (!this.document) throw ERR_NO_DOCUMENT;

    // const capabilities = await parseRoles(user.roles);
    // if (!capabilities.includes('root') && !capabilities.includes('seriesAdd')) throw new ERR_ACCESS_REJECTED();
    // if (!capabilities.includes('root') && user.statistics.dubberTeamMember !== dubberId) throw new E403(`User cannot upload episodes in other dubs`);

    // if (order > this._vl.maxEpisodesCount || order < 0) throw new E400(`Order is out of range`);
    // if (this.document.episodes.some(el => el.dubberID === dubberId && el.order === order)) throw new ERR_ALREADY_EXIST(`Episode in this dub and order already exist`);

    // const dubber = await new DubberService().getById(dubberId);

    // if (!TestMode) {
    //   const res = await NekomiUploadsAPI.uploadFile({ file, type: 'video/title/episode', uploadedById: user.id, qualities });
    // }
  }



  /**
   * Delete exist anime episode
   * Dubber member can delete episode only from own dubbing
   * Will save the document
   * 
   * @access seriesDelete
   */
  async deleteEpisode(dubberId: string, order: number, user: User): Promise<AnimeDeleteEpisode> {
    if (!this.document) throw ERR_NO_DOCUMENT;

    const capabilities = await parseRoles(user.roles);
    if (!capabilities.includes('root') && !capabilities.includes('seriesDelete')) throw new ERR_ACCESS_REJECTED();
    if (!capabilities.includes('root') && user.statistics.dubberTeamMember !== dubberId) throw new E403(`User cannot delete episodes from not own dubbing`);

    const episode = this.document.episodes.find(el => el.dubberID === dubberId && el.order === order);
    if (!episode) {
      Logger.fail(`[AnimeService/${this.document.uuid}]: Cannot delete not exist episode`);

      return {};
    }

    const uploadId = NekomiUploadsAPI.getUploadIdFromURL(episode.qualities.q1080);

    if (!TestMode) {
      await NekomiUploadsAPI.deleteUpload({ id: uploadId, deletedById: user.id, withChildren: true });
    }

    const msg = `Episode deleted. [id: ${uploadId}; dubberId: ${dubberId}; order: ${order}]`;

    Logger.debug(`[AnimeService/${this.document.uuid}]: ${msg}`);
    this.stack.push(msg);

    this.document.episodes = this.document.episodes.filter(el => el.dubberID !== dubberId && el.order !== order);
    this.document.markModified('episodes');

    await this.save();

    return {
      episodeDeleted: true
    };
  }
}



export default AnimeService;
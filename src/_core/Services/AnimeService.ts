import Anime, { ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_SEASON, ANIME_STATUS } from '~/core/interfaces/AnimeIntf';
import AnimeModel from '~/core/models/AnimeModel';
import axios from 'axios';
import getUTC from '~/utils/get-utc';
import trimString from '~/utils/trim-string';
import validator from 'validator';
import { E400, E404, ERR_ALREADY_EXIST, ERR_NO_DOCUMENT } from '~/services/ErrorService';
import { HydratedDocument } from 'mongoose';
import { Logger } from '~/services/LoggerService';
import { MALGenres } from '~/utils/mal-mappers';
import { MongoDocumentDTO } from './DTO';
import { MyAnimeListNode, ServiceControls } from '~/core/interfaces/types';
import { TestMode, config } from '~/config';
import { createSlug } from '~/utils/create-slug';
import { createUUID } from '~/utils/create-id';



interface AnimeCreateProps {
  nameEng: string
}

type AnimeModelControlsType = ServiceControls<AnimeCreateProps, Anime>



export const ERR_NAME_LENGTH_INVALID = new E400(`English name must be between ${config.VALIDATION.PatchTitle.minNameLength} and ${config.VALIDATION.PatchTitle.maxNameLength} symbols length`, 'anime:name_length_invalid');



class AnimeModelControls implements AnimeModelControlsType {
  async create(props: AnimeCreateProps): Promise<Anime> {
    let { nameEng } = props;

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
        alt: [`~draft-${uuid}`]
      },

      score: {
        imdb: null,
        mal: null,
        malScoredBy: null
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
    await document.save();

    Logger.info(`[AnimeService]: New document has been created. [uuid: ${uuid}]`);

    return instance;
  }

  async deleteOne(uuid: string): Promise<void> {
    await AnimeModel.deleteOne({ uuid });

    Logger.info(`[AnimeService]: Single document has been deleted. [uuid: ${uuid}]`);
  }

  async deleteMany(uuid: string): Promise<void> {
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
    const document = await AnimeModel.findOne({ $or: [{ id: query }, { uuid: query }, { slug: query }, { code: query }, { malId: +query }, { mal_id: query }] });
    if (!document) throw new E404(`Anime by query (${query}) is not found`);

    return new MongoDocumentDTO().anime({ document, details });
  }
}



export class AnimeService extends AnimeModelControls {
  private document: HydratedDocument<Anime> | null = null;
  private stack: string[] = [];



  async init(query: string) {
    const document = await AnimeModel.findOne({ $or: [{ id: query }, { uuid: query }, { slug: query }, { code: query }] }); // Hydrated document required, find by built-in method is not possible
    if (!document) throw new E404(`Document ${query} is not found`);

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



  /** Fetch details from myanimelist & save */
  async syncWithMyAnimeList() {
    if (!this.document) throw ERR_NO_DOCUMENT;
    if (this.anime.malId === undefined) return;

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

      // this.document.related = [];
      // for (const key in node.related_anime) {
      //   const el = node.related_anime[key].node;

      //   try {
      //     const anime = await new AnimeService().getByQuery(el.id);

      //     this.document.related.push(anime.uuid);
      //   } catch (e) { continue; }
      // }

      this.document.poster = this.document.poster.includes(config.DOMAIN.nekomi_media) ? this.document.poster : node.main_picture.large;



      this.document.malSyncedAt = getUTC().timestamp;
    } catch (e) {
      return Logger.fail(`[AnimeService]: Cannot sync with myanimelist`, e);
    }
  }
}



export default AnimeService;
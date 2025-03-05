import Anime, { ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_SEASON, ANIME_STATUS } from '~/core/interfaces/Anime.intf';
import AnimeModel from '~/core/models/AnimeModel';
import ServiceControls from '~/core/interfaces/ServiceControls';
import getUTC from '~/utils/get-utc';
import trimString from '~/utils/trim-string';
import validator from 'validator';
import { DevelopmentMode, config } from '~/config';
import { E400, E404, ERR_ALREADY_EXIST } from '~/services/ErrorService';
import { HydratedDocument } from 'mongoose';
import { Logger } from '~/services/LoggerService';
import { MongoDocumentDTO } from './DTO';
import { createSlug } from '~/utils/create-slug';
import { createUUID } from '~/utils/create-id';



interface AnimeCreateProps {
  nameEng: string

  DEV_UUID?: string
}

type AnimeModelControlsType = ServiceControls<AnimeCreateProps, Anime>



export const ERR_NAME_LENGTH_INVALID = new E400(`English name must be between ${config.VALIDATION.PatchTitle.minNameLength} and ${config.VALIDATION.PatchTitle.maxNameLength} symbols length`, 'anime:name_length_invalid');



class AnimeModelControls implements AnimeModelControlsType {
  private document: HydratedDocument<Anime> | null = null;
  private stack: string[] = [];



  async create(props: AnimeCreateProps): Promise<Anime> {
    const { DEV_UUID } = props;
    let { nameEng } = props;

    nameEng = trimString(nameEng);

    // Validate eng name length
    if (!validator.isLength(nameEng, { min: config.VALIDATION.PatchTitle.minNameLength, max: config.VALIDATION.PatchTitle.maxNameLength })) throw ERR_NAME_LENGTH_INVALID;

    const uuid = DevelopmentMode ? DEV_UUID ?? createUUID() : createUUID();
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
      seasonNew: ANIME_SEASON.SPRING,
      statusNew: ANIME_STATUS.FINISHED_AIRING,
      year: getUTC().year,
      updatedAt: getUTC().timestamp,
      poster: config.vars.defaultPoster,

      broadcast: null,
      description: null,
      details: null,
      episodesCount: null,
      malId: null,
      malSyncedAt: null,

      studiosNew: [],
      related: [],
      pictures: [],
      genresNew: [],
      episodes: [],
      episodesMeta: [],


      //* DEPRECATED
      id: uuid,
      code: slug,
      genres: [],
      mal_id: null,
      type: 'special',
      studios: [],
      status: 'out',
      season: 'spring',
      rating: {
        IMDB: null,
        Animee: null,
        mal: null,
        mal_poll: null
      },
      ageRate: 'G',
      country: 'Other'
    };

    const document = new AnimeModel(instance);
    // await document.save();

    Logger.info(`[AnimeService]: New document has been created. [uuid: ${uuid}]`);

    return document;
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

  async getById(id: string, details?: boolean): Promise<Anime> {
    const document = await AnimeModel.findOne({ id });
    if (!document) throw new E404(`Anime by id (${id}) is not found`);

    return new MongoDocumentDTO().anime({ document, details });
  }

  async getByQuery(query: string, details?: boolean): Promise<Anime> {
    const document = await AnimeModel.findOne({ $or: [{ id: query }, { slug: query }] });
    if (!document) throw new E404(`Anime by query (${query}) is not found`);

    return new MongoDocumentDTO().anime({ document, details });
  }
}



export class AnimeService extends AnimeModelControls {

}



export default AnimeService;
import DubberModel from '../models/DubberModel';
import ServiceCRUD from '../interfaces/ServiceCRUD';
import validator from 'validator';
import { E400, E404, E500 } from '../../services/ErrorService';
import { HydratedDocument } from 'mongoose';
import { IDubber } from '../interfaces/IDubber';
import { Logger } from '../../services/LoggerService';
import { MongoDocumentDTO } from './DTO';
import { TestMode, config } from '../../config';
import { createSlug, getUTC, getUUID, trimString } from '../../handlers/handler';



interface IDubberCreateProps {
  nameUkr: string
  nameEng: string

  /** Set dubber id. Only in test mode */
  DEV_ID?: string
}



type TDubberCRUD = ServiceCRUD<IDubberCreateProps, IDubber>



const ERR_NAME_LENGTH_INVALID = new E400(`Dubber name must be in range between ${config.VALIDATION.CreateUser.minNameLength} and ${config.VALIDATION.CreateUser.maxNameLength} symbols`, 'dubber:name_length_invalid');
const ERR_NAME_NOT_LATIN = new E400(`Dubber english name must contain only latin letters`, 'dubber:name_not_latin');

const ERR_NO_DOCUMENT = new E500(`NO DOCUMENT PASSED INTO CONSTRUCTOR`, 'dubber:no_document');



class DubberCRUD implements TDubberCRUD {
  async create(props: IDubberCreateProps): Promise<IDubber> {
    const { DEV_ID } = props;
    let { nameUkr, nameEng } = props;

    nameUkr = trimString(nameUkr);
    nameEng = trimString(nameEng);

    if (!validator.isLength(nameUkr, { min: config.VALIDATION.CreateUser.minNameLength, max: config.VALIDATION.CreateUser.maxNameLength })) throw ERR_NAME_LENGTH_INVALID;
    if (!validator.isLength(nameEng, { min: config.VALIDATION.CreateUser.minNameLength, max: config.VALIDATION.CreateUser.maxNameLength })) throw ERR_NAME_LENGTH_INVALID;
    if (!validator.isAlpha(nameEng.replaceAll(' ', ''), 'en-US')) throw ERR_NAME_NOT_LATIN;

    const id = TestMode && DEV_ID ? DEV_ID : getUUID();
    const createdAt = getUTC().timestamp;
    const slug = createSlug(nameEng);



    const instance: IDubber = {
      id,
      nameUkr,
      nameEng,
      name: nameUkr,
      slug,
      avatar: config.vars.defaultAvatar,
      banner: config.vars.defaultBanner,
      description: null,
      members: [],
      membersInvited: [],
      socials: {
        instagram: null,
        telegram: null,
        tiktok: null,
        youtube: null
      },
      support: {
        bymeacoffee: null,
        diaka: null,
        monobank: null,
        patreon: null,
        privatbank: null
      },
      statistics: {
        createdAt
      },
      createdAt,
      code: slug
    };

    const dubber = new DubberModel(instance);
    // await dubber.save();

    Logger.info(`[DubberService]: New document has been created. [id: ${id}]`);

    return instance;
  }

  async deleteOne(id: string): Promise<void> {
    await DubberModel.deleteOne({ id });

    Logger.info(`[DubberService]: 1 document has been deleted. [id: ${id}]`);
  }

  async deleteMany(id: string): Promise<void> {
    const details = await DubberModel.deleteMany({ id });

    Logger.info(`[DubberService]: ${details.deletedCount} document have been deleted. [id: ${id}]`);
  }

  async getAll(details?: boolean): Promise<IDubber[]> {
    const total = await DubberModel.find();
    const list = total.map(document => {
      return new MongoDocumentDTO().dubber({ document, details });
    });

    return list;
  }

  async getById(id: string, details?: boolean): Promise<IDubber> {
    const document = await DubberModel.findOne({ id });
    if (!document) throw new E404(`Dubber ${id} is not found`);

    return new MongoDocumentDTO().dubber({ document, details });
  }

  async getByQuery(query: string, details?: boolean): Promise<IDubber> {
    const document = await DubberModel.findOne({ $or: [{ id: query, slug: query }] });
    if (!document) throw new E404(`Dubber ${query} is not found`);

    return new MongoDocumentDTO().dubber({ document, details });
  }
}

/** This service must be initialized by calling @method init() */
export class DubberService extends DubberCRUD {
  private document: HydratedDocument<IDubber> | null = null;

  async init(id: string) {
    this.document = await DubberModel.findOne({ id });
  }

  async changeName() {
    if (!this.document) throw ERR_NO_DOCUMENT;
  }
}



export default DubberService;
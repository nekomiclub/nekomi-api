import DubberModel from '../models/DubberModel';
import ServiceCRUD from '../interfaces/ServiceCRUD';
import validator from 'validator';
import { E400, E404, ERR_LENGTH_INVALID, ERR_NO_DOCUMENT } from '../../services/ErrorService';
import { HydratedDocument } from 'mongoose';
import { IDubber } from '../interfaces/IDubber';
import { Logger } from '../../services/LoggerService';
import { MongoDocumentDTO } from './DTO';
import { TestMode, config } from '../../config';
import { createSlug, createStringID, createUUID, getUTC, trimString } from '../../handlers/handler';



interface IDubberCreateProps {
  nameUkr: string
  nameEng: string

  /** Set dubber id. Only in test mode */
  DEV_ID?: string
}

interface IDubberCRUDProps {
  testMode?: boolean
}

interface IChangeName {
  nameEng?: string
  nameUkr?: string
}

interface IPatchSocialLink {
  key: keyof IDubber['socials'],
  value: string | null
}

interface IPatchSupportlLink {
  key: keyof IDubber['support'],
  value: string | null
}



type TDubberCRUD = ServiceCRUD<IDubberCreateProps, IDubber>



const ERR_NAME_LENGTH_INVALID = new E400(`Dubber name must be in range between ${config.VALIDATION.CreateUser.minNameLength} and ${config.VALIDATION.CreateUser.maxNameLength} symbols`, 'dubber:name_length_invalid');
const ERR_NAME_NOT_LATIN = new E400(`Dubber english name must contain only latin letters`, 'dubber:name_not_latin');
const ERR_DESCRIPTION_LENGTH_INVALUD = new E400(`Description must be shorter than ${config.VALIDATION.PatchTitle.maxDescriptionLength} symbols length`, 'dubber:description_length_invalid');
const ERR_LINK_DOMAIN_MISSMATCH = new E400(`Some links points to invalid domains or link parsed with error`, 'dubber:link_domain_missmatch');



class DubberCRUD implements TDubberCRUD {
  readonly TestMode: boolean;

  constructor(props?: IDubberCRUDProps) {
    this.TestMode = props?.testMode ?? TestMode;
  }



  async create(props: IDubberCreateProps): Promise<IDubber> {
    const { DEV_ID } = props;
    let { nameUkr, nameEng } = props;

    nameUkr = trimString(nameUkr);
    nameEng = trimString(nameEng);

    if (!validator.isLength(nameUkr, { min: config.VALIDATION.CreateUser.minNameLength, max: config.VALIDATION.CreateUser.maxNameLength })) throw ERR_NAME_LENGTH_INVALID;
    if (!validator.isLength(nameEng, { min: config.VALIDATION.CreateUser.minNameLength, max: config.VALIDATION.CreateUser.maxNameLength })) throw ERR_NAME_LENGTH_INVALID;
    if (!validator.isAlpha(nameEng.replaceAll(' ', ''), 'en-US')) throw ERR_NAME_NOT_LATIN;

    const id = this.TestMode && DEV_ID ? DEV_ID : createUUID();
    const createdAt = getUTC().timestamp;
    let slug = createSlug(nameEng);

    const exist = await DubberModel.findOne({ slug });
    if (exist) slug = slug + `-${createStringID(3)}`;



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
    await dubber.save();

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
    const document = await DubberModel.findOne({ $or: [{ id: query }, { slug: query }] });
    if (!document) throw new E404(`Dubber ${query} is not found`);

    return new MongoDocumentDTO().dubber({ document, details });
  }
}

/** This service must be initialized by calling @method init() */
export class DubberService extends DubberCRUD {
  private document: HydratedDocument<IDubber> | null = null;
  private stack: string[] = [];

  async init(id: string) {
    this.document = await DubberModel.findOne({ id });
  }

  /** Save the document
   * @returns current patch stack
   */
  async save(): Promise<string[]> {
    if (!this.document) throw ERR_NO_DOCUMENT;

    await this.document.save();

    Logger.debug(`[DubberService]: Document patched. [id: ${this.document.id}; changes: ${this.stack.join(', ')}]`);

    return this.stack;
  }

  get dubber() {
    if (!this.document) throw ERR_NO_DOCUMENT;
    return new MongoDocumentDTO().dubber({ document: this.document, details: true });
  }



  /** Changing nameEng will also change slug */
  async changeName({ nameEng, nameUkr }: IChangeName) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    if (nameUkr !== undefined) {
      nameUkr = trimString(nameUkr);
      if (!validator.isLength(nameUkr, { min: config.VALIDATION.CreateUser.minNameLength, max: config.VALIDATION.CreateUser.maxNameLength })) throw ERR_LENGTH_INVALID;

      this.stack.push(`nameUkr: ${this.document.nameUkr} > ${nameUkr}`);

      this.document.nameUkr = nameUkr;
      this.document.markModified('nameUkr');
    }

    if (nameEng !== undefined) {
      nameEng = trimString(nameEng);
      if (!validator.isLength(nameEng, { min: config.VALIDATION.CreateUser.minNameLength, max: config.VALIDATION.CreateUser.maxNameLength })) throw ERR_LENGTH_INVALID;
      if (!validator.isAlpha(nameEng.replaceAll(' ', ''), 'en-US')) throw ERR_NAME_NOT_LATIN;

      let slug = createSlug(nameEng);

      const exist = await DubberModel.findOne({ slug });
      if (exist) slug = slug + `-${createStringID(3)}`;

      this.stack.push(`nameEng: ${this.document.nameEng} > ${nameEng}`);
      this.stack.push(`slug: ${this.document.slug} > ${slug}`);

      this.document.nameEng = nameEng;
      this.document.slug = slug;
      this.document.code = slug;

      this.document.markModified('nameEng');
      this.document.markModified('slug');
      this.document.markModified('code');
    }
  }

  async changeDescription(description: string | null) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    if (description?.length) {
      description = trimString(description);
      if (!validator.isLength(description, { max: config.VALIDATION.PatchTitle.maxDescriptionLength })) ERR_DESCRIPTION_LENGTH_INVALUD;

      this.stack.push(`description: ${this.document.description?.length} symbols > ${description.length} symbols`);
    } else {
      description = null;

      this.stack.push(`description: ${this.document.description?.length} symbols > null`);
    }

    this.document.description = description;
    this.document.markModified('description');
  }

  async changeSocials({ key, value }: IPatchSocialLink) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    value = value?.length ? value : null;

    try {
      if (value !== null) {
        const { host } = new URL(value);

        if (key === 'instagram' && host !== 'instagram.com') throw null;
        if (key === 'telegram' && host !== 't.me') throw null;
        if (key === 'tiktok' && host !== 'tiktok.com') throw null;
        if (key === 'youtube' && host !== 'youtube.com') throw null;
      }
    } catch (e) {
      throw ERR_LINK_DOMAIN_MISSMATCH;
    }

    this.stack.push(`social ${key}: ${this.document.socials[key]} > ${value}`);

    this.document.socials[key] = value;
    this.document.markModified('socials');
  }

  async changeSupport({ key, value }: IPatchSupportlLink) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    value = value?.length ? value : null;

    try {
      if (value !== null) {
        const { host } = new URL(value);

        if (key === 'bymeacoffee' && host !== 'bymeacoffee.com') throw null;
        if (key === 'diaka' && host !== 'diaka.ua') throw null;
        if (key === 'monobank' && host !== 'send.monobank.ua') throw null;
        if (key === 'patreon' && host !== 'patreon.com') throw null;
        if (key === 'privatbank') throw null;
      }
    } catch (e) {
      throw ERR_LINK_DOMAIN_MISSMATCH;
    }

    this.stack.push(`support ${key}: ${this.document.support[key]} > ${value}`);

    this.document.support[key] = value;
    this.document.markModified('support');
  }



  async addMember() {
    if (!this.document) throw ERR_NO_DOCUMENT;
  }

  async editMember() {
    if (!this.document) throw ERR_NO_DOCUMENT;
  }

  async deleteMember() {
    if (!this.document) throw ERR_NO_DOCUMENT;
  }

  async inviteMember() {
    if (!this.document) throw ERR_NO_DOCUMENT;
  }



  async changeAvatar() {
    if (!this.document) throw ERR_NO_DOCUMENT;
  }

  async changeBanner() {
    if (!this.document) throw ERR_NO_DOCUMENT;
  }
}



export default DubberService;
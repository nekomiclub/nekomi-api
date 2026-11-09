import mongoose, { Schema } from 'mongoose';

import { NekomiUploadService } from '~/api/external/nekomi-upload-service.js';
import conf, { isTesting } from '~/conf.js';
import ITeam from '~/domain/team.schema.js';
import { asTeamId,CDNString } from '~/interfaces/BrandedIds.js';
import { NUS_UPLOAD_TYPE } from '~/interfaces/external-api/INekomiUploadService.api.js';
import { RepositoryQueriesType } from '~/interfaces/types.js';
import DTS from '~/services/DataTransferService.js';
import { NekoError } from '~/services/ExceptionService.js';
import Logger from '~/services/LoggerService.js';
import createId, { createNanoId } from '~/utils/create-id.js';
import createSlug from '~/utils/create-slug.js';
import { getUTC, trimString } from '~/utils/utils.js';

import UnifiedRepositoryClass from './UnifiedRepository.js';



/** Repository type. Reffers to the model interface */
type RepositoryType = ITeam;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ id: query }, { slug: query }] };
};



const schema = new Schema<RepositoryType>({
  id: String,
  slug: String,

  avatar: String,
  cover: String,

  about: String,
  name: String,

  members: [Schema.Types.Mixed],

  created_at: String,
  updated_at: String,

  socials: {
    telegram: String,
    instagram: String,
    youtube: String,
    tiktok: String,
  },

  support: {
    diaka: String,
    monobank: String,
    privatbank: String,
    bymeacoffee: String,
    patreon: String,
  },
}, { strict: false, versionKey: false });

const model = mongoose.model<RepositoryType>('teams', schema);



interface ICreateProps {
  /** Save the document in the database. @default true */
  saveDocument?: boolean
}

interface ISaveProps {
  /** Save document without diff writing */
  saveOnly?: boolean
}

interface IUploadACProps {
  type: NUS_UPLOAD_TYPE
  key: keyof Pick<ITeam, 'avatar' | 'cover'>
  defaultUrl: string
  userId: string
}




export class TeamRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor() {
    super(model, queries);

    this.RepositoryName = 'DubberRepository';
  }

  get document(): RepositoryType {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    return this._doc;
  }



  async save(props?: ISaveProps) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._set('updated_at', getUTC().ISO);

    await this._save({ id: this._doc.id, ...props });
  }



  async deleteOne(id: string): Promise<void> {
    throw new NekoError('sys:not_implemented');

    // DubberSearch.update();
  }



  /** @unavailable */
  async deleteMany(): Promise<void> {
    throw new NekoError('sys:not_implemented', `Method is unavailable`);
  }



  /** @todo Detach name specification */
  async create(props?: ICreateProps): Promise<RepositoryType> {
    const saveDocument = props?.saveDocument ?? true;

    const id = asTeamId(isTesting ? `~testing-${createNanoId()}` : createId());
    const name = `Dubber ${createNanoId()}`;
    const slug = createSlug(name);



    const payload: RepositoryType = {
      id,
      name,
      slug,
      about: null,
      avatar: conf.variables.default_avatar_url,
      cover: conf.variables.default_team_cover_url,
      created_at: getUTC().ISO,
      updated_at: getUTC().ISO,
      members: [],
      socials: {},
      support: {}
    };

    const document = new model(payload);
    if (saveDocument) await document.save();

    Logger.info(`[${this.RepositoryName}]: New document has been created! [id: ${id}]`);
    this._doc = document;

    return DTS.team(payload, true);
  }



  /** 
   * Set name
   * 
   * @testing
   */
  async setName(name: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // TODO: Add slug updating

    this._set('name', name);
  }



  /**
   * Set about
   * 
   * @testing
   */
  setAbout(about: string | null) {
    if (about || about === null) {
      if (about) {
        about = trimString(about);
      }

      this._set('about', about);
    }
  }



  /**
   * Set social link
   * 
   * @testing
   */
  setSocial(key: keyof ITeam['socials'], value: string | undefined) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // TODO: Add validation

    this._set(`socials.${key}`, value);
  }



  /**
   * Set support link
   * 
   * @testing
   */
  setSupport(key: keyof ITeam['support'], value: string | undefined) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // TODO: Add validation

    this._doc.support[key] = value;
    this._doc.markModified('support');
  }



  /**
   * Upload avatar
   * 
   * @returns CDNString
   * @autosave
   * @testing
   */
  async uploadAvatar(buffer: Buffer, userId: string): Promise<CDNString> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    return await this._uploadAC(buffer, {
      type: NUS_UPLOAD_TYPE.PHOTO_AVATAR,
      key: 'avatar',
      defaultUrl: conf.variables.default_avatar_url,
      userId
    });
  }



  /**
   * Upload cover
   * 
   * @returns CDNString
   * @autosave
   * @testing
   */
  async uploadCover(buffer: Buffer, userId: string): Promise<CDNString> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    return await this._uploadAC(buffer, {
      type: NUS_UPLOAD_TYPE.PHOTO_COVER,
      key: 'cover',
      defaultUrl: conf.variables.default_team_cover_url,
      userId
    });
  }



  /**
   * Upload avatar/cover
   * 
   * @returns CDNString
   * @autosave
   * @private
   */
  private async _uploadAC(buffer: Buffer, { type, defaultUrl, key, userId }: IUploadACProps): Promise<CDNString> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const { objects } = await NekomiUploadService.uploadFile({ buffer, type, uploaderId: userId });

    const object = objects.find(el => el.type === type);
    if (!object) throw new NekoError('nus:object_not_found', `Team "${type}" object is not found in upload objects`);



    // Delete old object
    if (this._doc[key] !== defaultUrl) {
      try {
        await NekomiUploadService.deleteFile(NekomiUploadService.getId(this._doc[key]), userId);
      } catch (e) {
        Logger.warn(`[${this.RepositoryName}]: Cannot delete team old "${type}" (${this._doc[key]}) [id: ${this._doc.id}]`, e);
      }
    }

    this._set(key, object.url);
    await this.save();

    return object.url;
  }
}



const TeamRepository = new TeamRepositoryClass();

export default TeamRepository;
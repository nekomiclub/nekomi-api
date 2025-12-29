import DocumentDTO from '~/service/DataTransferService';
import IDubber, { IDubberMember } from '~/intf/IDubber';
import Logger from '~/service/LoggerService';
import UnifiedRepositoryClass from './UnifiedRepository';
import conf, { TestMode } from '~/config';
import createId, { createNanoId } from '~/utils/create-id';
import createSlug from '~/utils/create-slug';
import mongoose, { Schema } from 'mongoose';
import { CDNString, RepositoryQueriesType } from '~/intf/types';
import { NUS_UPLOAD_TYPE } from '~/intf/external-api/INekomiUploadService.api';
import { NekoError } from '~/service/ExceptionService';
import { NekomiUploadService } from '~/api/external/nekomi-upload-service';
import { getUTC, trimString } from '~/utils/utils';



/** Repository type. Reffers to the model interface */
type RepositoryType = IDubber;

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

const model = mongoose.model<RepositoryType>('dubber', schema);



interface ICreateProps {
  /** //! Must be removed after 3.0.0 release */
  _implicitCreatedAt?: string
  /** //! Must be removed after 3.0.0 release */
  _implicitId?: string

  /** Save the document in the database. @default true */
  saveDocument?: boolean
}



export class DubberRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor() {
    super(model, queries);
  }

  get document(): RepositoryType | null {
    return this._doc ? DocumentDTO.dubber(this._doc, true) : null;
  }

  async save() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this.set('updated_at', getUTC().ISO);
    await this.update();

    Logger.debug(`[DubberRepository]: Document saved. [id: ${this._doc.id}; diff: ${this.diff.join('; ')}]`);
  }



  async deleteOne(id: string): Promise<void> {
    throw new NekoError('sys:not_implemented');
  }



  async deleteMany(id: string): Promise<void> {
    throw new NekoError('sys:not_implemented');
  }



  /** @todo Detach name specification */
  async create(props?: ICreateProps): Promise<RepositoryType> {
    const saveDocument = props?.saveDocument ?? true;

    const id = props?._implicitId ? props._implicitId : TestMode ? `~testing-${createNanoId()}` : createId();
    const name = `Dubber ${createNanoId()}`;
    const slug = createSlug(name);



    const payload: RepositoryType = {
      id,
      name,
      slug,
      about: null,
      avatar: conf.vars.defaultAvatar,
      cover: conf.vars.defaultCover,
      created_at: props?._implicitCreatedAt ?? getUTC().ISO,
      updated_at: getUTC().ISO,
      members: [],
      socials: {},
      support: {}
    };

    const document = new model(payload);
    if (saveDocument) await document.save();

    Logger.info(`[DubberRepository]: New document has been created! [id: ${id}]`);
    this._doc = document;

    return DocumentDTO.dubber(payload, true);
  }



  /** 
   * Set name
   * 
   * @testing
   */
  async setName(name: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // TODO: Add slug updating

    this.set('name', name);
  }



  /** 
   * Set slug
   * 
   * ! Implicitly set slug. Must be removed after 3.0.0 release
   */
  async _setSlug(slug: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const exist = await this.safeGetOne(slug);
    if (exist) throw new NekoError('sys:already_exist', `Dubber with slug "${slug}" is already exist`);

    this.set('slug', slug);
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

      this.set('about', about);
    }
  }



  /** 
   * Set members
   * 
   * ! Implicitly set members. Must be removed after 3.0.0 release
   */
  _setMembers(members: IDubberMember[]) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this.set('members', members);
  }



  /**
   * Set social link
   * 
   * @testing
   */
  setSocial(key: keyof IDubber['socials'], value: string | undefined) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // TODO: Add validation

    this._doc.socials[key] = value;
    this._doc.markModified('socials');
  }



  /**
   * Set support link
   * 
   * @testing
   */
  setSupport(key: keyof IDubber['support'], value: string | undefined) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // TODO: Add validation

    this._doc.support[key] = value;
    this._doc.markModified('support');
  }



  /**
   * Upload avatar
   * 
   * @returns avatar url
   * @autosave
   * @testing
   */
  async uploadAvatar(buffer: Buffer, userId: string): Promise<CDNString> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const { objects } = await NekomiUploadService.uploadFile({ buffer, type: NUS_UPLOAD_TYPE.PHOTO_AVATAR, uploaderId: userId });

    const avatar = objects.find(el => el.type === NUS_UPLOAD_TYPE.PHOTO_AVATAR);
    if (!avatar) throw new NekoError('nus:object_not_found', `Dubber avatar is not found in upload objects`);

    // Delete old avatar
    try {
      if (this._doc.avatar !== conf.vars.defaultAvatar) {
        await NekomiUploadService.deleteFile(NekomiUploadService.getId(this._doc.avatar), userId);
      }
    } catch (e) {
      Logger.warn(`[DubberRepository]: Cannot delete dubber old avatar (${this._doc.avatar}) [id: ${this._doc.id}]`);
    }

    this.set('avatar', avatar.url);

    await this.save();

    return avatar.url;
  }



  /**
   * Upload cover
   * 
   * @returns cover url
   * @autosave
   * @testing
   */
  async uploadCover(buffer: Buffer, userId: string): Promise<CDNString> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const { objects } = await NekomiUploadService.uploadFile({ buffer, type: NUS_UPLOAD_TYPE.PHOTO_COVER, uploaderId: userId });

    const cover = objects.find(el => el.type === NUS_UPLOAD_TYPE.PHOTO_COVER);
    if (!cover) throw new NekoError('nus:object_not_found', `Dubber cover is not found in upload objects`);

    // Delete old cover
    try {
      if (this._doc.cover !== conf.vars.defaultCover) {
        await NekomiUploadService.deleteFile(NekomiUploadService.getId(this._doc.cover), userId);
      }
    } catch (e) {
      Logger.warn(`[DubberRepository]: Cannot delete dubber old cover (${this._doc.cover}) [id: ${this._doc.id}]`);
    }

    this.set('cover', cover.url);

    await this.save();

    return cover.url;
  }
}



const DubberRepository = new DubberRepositoryClass();

export default DubberRepository;
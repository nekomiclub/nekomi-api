import DTS from '~/service/DataTransferService.js';
import IUser, { IUserViewProgress, USER_LIB_TYPE_ENUM, USER_RESTRICTION_ENUM } from '~/schemas/entities/User.schema.js';
import Logger from '~/service/LoggerService.js';
import RoleRepository from './RoleRepository.js';
import TeamRepository from './TeamRepository.js';
import UnifiedRepositoryClass, { UnifiedModelClass } from './UnifiedRepository.js';
import UserValidators from '~/utils/validators/user-validators.js';
import conf, { TestMode } from '~/conf.js';
import createId, { createNanoId, createUserLibId } from '~/utils/create-id.js';
import mongoose, { Schema } from 'mongoose';
import { AnimeId, CDNString } from '~/intf/BrandedIds.js';
import { NUS_UPLOAD_TYPE } from '~/intf/external-api/INekomiUploadService.api.js';
import { NekoError } from '~/service/ExceptionService.js';
import { NekomiUploadService } from '~/api/external/nekomi-upload-service.js';
import { RepositoryQueriesType } from '~/intf/types.js';
import { UserLibId } from '~/intf/BrandedIds.js';
import { asUserId } from '~/intf/BrandedIds.js';
import { calcISO, getUTC } from '~/utils/utils.js';



/** Repository type. Reffers to the model interface */
type RepositoryType = IUser;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ id: query }, { username: query }] };
};



const schema = new Schema<RepositoryType>({
  id: String,
  username: String,
  email: String,

  avatar: String,
  cover: String,

  roles: [String],
  libs: [Schema.Types.Mixed],
  restrictions: [Schema.Types.Mixed],
  sessions: [Schema.Types.Mixed],
  subscriptions: [Schema.Types.Mixed],

  total_viewtime: Number,
  view_progress: [Schema.Types.Mixed],
  dubber_team_member: String,
  telegram_id: Number,

  created_at: String,
  updated_at: String,
  username_changed_at: String,
}, { strict: false, versionKey: false });

const model = mongoose.model<RepositoryType>('users', schema);



interface ICreateProps {
  /** Save the document in the database. @default true */
  saveDocument?: boolean
}

interface ISaveProps {
  /** Save document without diff writing */
  saveOnly?: boolean
}

interface ISetUsernameProps {
  /** Bypass user change restriction */
  bypassRestriction?: boolean
  provided?: boolean
}

interface IUpdateLibProps {
  is_public?: boolean
}

interface IUploadAvatarProps {
  /** Bypass user change restriction */
  bypassRestriction?: boolean
}

interface IUploadCoverProps {
  /** Bypass user change restriction */
  bypassRestriction?: boolean
}

interface IUploadACProps {
  type: NUS_UPLOAD_TYPE
  key: keyof Pick<IUser, 'avatar' | 'cover'>
  defaultUrl: string
}



/** Bare user model implementation */
export class UserModel extends UnifiedModelClass<RepositoryType> {
  constructor() {
    super(model, queries);

    this.RepositoryName = 'UserRepository';
  }



  get document(): RepositoryType {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    return DTS.user(this._doc, true);
  }



  async save() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._set('updated_at', getUTC().ISO);

    await this._save({ id: this._doc.id });
  }
}



/** User repository CRUD */
export class UserRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor() {
    super(model, queries);

    this.RepositoryName = 'UserRepository';
  }



  get document(): RepositoryType {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    return DTS.user(this._doc, true);
  }



  async save(props?: ISaveProps) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._set('updated_at', getUTC().ISO);

    await this._save({ id: this._doc.id, ...props });
  }



  async deleteOne(id: string): Promise<void> {
    throw new NekoError('sys:not_implemented');

    // UserSearch.update();
  }



  /** @unavailable */
  async deleteMany(): Promise<void> {
    throw new NekoError('sys:not_implemented', `Method is unavailable`);
  }



  /**
   * Create new user document
   */
  async create(props?: ICreateProps): Promise<RepositoryType> {
    const saveDocument = props?.saveDocument ?? true;

    const id = asUserId(TestMode ? `~testing-${createNanoId()}` : createId());

    const payload: RepositoryType = {
      id,
      username: `user_${createNanoId(4)}`,
      email: `example_${createNanoId(4)}@nekomi.club`,

      avatar: conf.vars.defaultAvatar,
      cover: conf.vars.defaultCover,

      roles: ['user'],
      libs: [
        { id: createUserLibId(), anime_ids: [], type: USER_LIB_TYPE_ENUM.FAVORITE, is_public: true, created_at: getUTC().ISO },
        { id: createUserLibId(), anime_ids: [], type: USER_LIB_TYPE_ENUM.PLANS, is_public: false, created_at: getUTC().ISO },
        { id: createUserLibId(), anime_ids: [], type: USER_LIB_TYPE_ENUM.WATCHED, is_public: true, created_at: getUTC().ISO },
        { id: createUserLibId(), anime_ids: [], type: USER_LIB_TYPE_ENUM.WATCHING, is_public: true, created_at: getUTC().ISO },
        { id: createUserLibId(), anime_ids: [], type: USER_LIB_TYPE_ENUM.DELAYED, is_public: false, created_at: getUTC().ISO },
      ],
      restrictions: [],
      sessions: [],
      subscriptions: [],

      total_viewtime: 0,
      view_progress: [],
      dubber_team_member: null,
      telegram_id: null,

      created_at: getUTC().ISO,
      updated_at: getUTC().ISO,
      username_changed_at: getUTC(0).ISO,
    };

    const document = new model(payload);
    if (saveDocument) await document.save();

    Logger.info(`[${this.RepositoryName}]: New document has been created! [id: ${id}]`);
    this._doc = document;

    return DTS.user(payload, true);
  }



  /**
   * Set username
   * 
   * @param provided Skip any validation except uniqueness
   * @testing
   */
  async setUsername(username: string, props?: ISetUsernameProps) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Reject users from setting username that match "testing"
    if (!TestMode && username.match(/testing/gi)) throw new NekoError('user:username_not_available');

    // Ensure username change is not restricted
    if (!props?.bypassRestriction && this._doc.restrictions.includes(USER_RESTRICTION_ENUM.USERNAME_CHANGE)) throw new NekoError(`sys:action_prevented`, `Username change is restricted by the administration`);

    // Ensure that user username is not on cooldown
    const usernameTimeoutTs = calcISO(this._doc.username_changed_at, conf.vars.USERNAME_UPDATE_TIMEOUT);
    if (usernameTimeoutTs > getUTC().timestamp) throw new NekoError('user:username_timeout', `You can change username only after ${getUTC(usernameTimeoutTs).ISO}`);

    // Validate username
    if (props?.provided) UserValidators.username.parse(username);
    else UserValidators.usernameFull.parse(username);

    // Ensure username is unique
    const exist = await this.safeGetOne(username);

    if (exist && exist.id !== this._doc.id) {
      if (props?.provided) username = `${username}_${createNanoId(5)}`;
      else throw new NekoError('sys:already_exist', `User "@${username}" already exist`);
    }

    this._set('username', username);
    this._set('username_changed_at', getUTC().ISO);
  }



  /**
   * Set email
   * 
   * @testing
   */
  async setEmail(email: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Validate email
    UserValidators.email.parse(email);

    // Ensure email is not exist
    const exist = await this.safeGetOne({ email });
    if (exist && exist.id !== this._doc.id) throw new NekoError('sys:already_exist', `User with email "${email}" is already exist`);

    this._set('email', email);
  }



  /**
   * Grant role
   * 
   * @testing
   */
  async grantRole(slug: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Pass if role is already assigned
    if (this._doc.roles.includes(slug)) return;

    const role = await RoleRepository.getOne(slug);

    this._doc.roles.push(role.slug);
    this._doc.markModified('roles');
  }



  /**
   * Revoke role
   * 
   * @testing
   */
  revokeRole(slug: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Pass if role is not assigned
    if (!this._doc.roles.includes(slug)) return;

    this._doc.roles = this._doc.roles.filter(el => el !== slug);
    this._doc.markModified('roles');
  }



  /**
   * Increase total viewtime
   * 
   * @testing
   */
  increaseTotalViewtime(sec: number) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (sec > UserValidators.limits.MAX_INCREASE_VIEWTIME_S) sec = UserValidators.limits.MAX_INCREASE_VIEWTIME_S;

    const viewtime = this._doc.total_viewtime + sec;

    this._set('total_viewtime', viewtime);
  }



  /**
   * Set team team member
   * 
   * @testing
   */
  async setTeamMember(id: string | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (!id?.length) id = null;

    // Ensure that team exist
    if (id) await TeamRepository.getOne(id);

    this._set('dubber_team_member', id);
  }



  /**
   * Set telegram id
   * 
   * @testing
   */
  setTelegramId(id: number | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._set('telegram_id', id);
  }



  /**
   * Append/edit viewprogress
   * 
   * @testing
   */
  setViewProgress({ anime_id, dubber_id, episode, progress }: Omit<IUserViewProgress, 'updated_at'>) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const node = this._doc.view_progress.find(el => el.anime_id === anime_id);

    if (node) {
      node.dubber_id = dubber_id;
      node.episode = episode;
      node.progress = progress;

      node.updated_at = getUTC().ISO;
    } else {
      this._doc.view_progress.push({ anime_id, dubber_id, episode, progress, updated_at: getUTC().ISO });
    }

    this._doc.markModified('view_progress');
  }



  /**
   * Remove view progress
   * 
   * @testing
   */
  removeViewProgress(animeId: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._doc.view_progress = this._doc.view_progress.filter(el => el.anime_id !== animeId);
  }



  /**
   * Update lib
   * 
   * @testing
   */
  updateLib(id: string, { is_public }: IUpdateLibProps) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const lib = this._doc.libs.find(el => el.id === id);
    if (!lib) throw new NekoError(`sys:not_found`, `Lib "${id}" is not found`);

    if (is_public !== undefined) lib.is_public = is_public;

    this._doc.markModified('libs');
  }



  /**
   * Append anime document in lib
   * 
   * @testing
   */
  async appendLibAnime(libId: UserLibId, animeId: AnimeId) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const lib = this._doc.libs.find(el => el.id === libId);
    if (!lib) throw new NekoError(`sys:not_found`, `Lib "${libId}" is not found`);

    if (lib.anime_ids.includes(animeId)) throw new NekoError('sys:already_exist', `Anime "${animeId}" is already exist in lib "${libId}"`);

    // ! Uncomment after 3.0.0 release
    // const anime = await AnimeRepository.getOne(animeId);

    lib.anime_ids.push(animeId);

    this._doc.markModified('libs');
  }



  /**
   * Remove anime document from lib
   * 
   * @param libId Lib id
   * @testing
   */
  removeLibAnime(libId: string, animeId: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const lib = this._doc.libs.find(el => el.id === libId);
    if (!lib) throw new NekoError(`sys:not_found`, `Lib "${libId}" is not found`);

    lib.anime_ids = lib.anime_ids.filter(el => el !== animeId);

    this._doc.markModified('libs');
  }



  /**
   * Append restriction
   * 
   * @testing
   */
  appendRestriction(slug: USER_RESTRICTION_ENUM) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Pass if restriction is already assigned
    if (this._doc.restrictions.includes(slug)) return;

    this._doc.restrictions.push(slug);
  }



  /**
   * Remove restriction
   * 
   * @testing
   */
  removeRestriction(slug: USER_RESTRICTION_ENUM) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Pass if restriction is not assigned
    if (!this._doc.restrictions.includes(slug)) return;

    this._doc.restrictions = this._doc.restrictions.filter(el => el !== slug);
  }



  /**
   * Upload avatar
   * 
   * @returns CDNString
   * @autosave
   * @testing
   */
  async uploadAvatar(buffer: Buffer, props?: IUploadAvatarProps): Promise<CDNString> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Ensure avatar upload is not restricted
    if (!props?.bypassRestriction && this._doc.restrictions.includes(USER_RESTRICTION_ENUM.UPLOAD_AVATAR)) throw new NekoError(`sys:action_prevented`, `Avatar upload is restricted by the administration`);



    return await this._uploadAC(buffer, {
      type: NUS_UPLOAD_TYPE.PHOTO_AVATAR,
      key: 'avatar',
      defaultUrl: conf.vars.defaultAvatar
    });
  }



  /**
   * Upload cover
   * 
   * @returns CDNString
   * @autosave
   * @testing
   */
  async uploadCover(buffer: Buffer, props?: IUploadCoverProps): Promise<CDNString> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Ensure cover upload is not restricted
    if (!props?.bypassRestriction && this._doc.restrictions.includes(USER_RESTRICTION_ENUM.UPLOAD_COVER)) throw new NekoError(`sys:action_prevented`, `Cover upload is restricted by the administration`);



    return await this._uploadAC(buffer, {
      type: NUS_UPLOAD_TYPE.PHOTO_COVER,
      key: 'cover', defaultUrl:
        conf.vars.defaultCover
    });
  }



  /**
   * Upload avatar/cover
   * 
   * @returns CDNString
   * @autosave
   * @private
   */
  private async _uploadAC(buffer: Buffer, { type, defaultUrl, key }: IUploadACProps): Promise<CDNString> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const { objects } = await NekomiUploadService.uploadFile({ buffer, type, uploaderId: this._doc.id });

    const object = objects.find(el => el.type === type);
    if (!object) throw new NekoError('nus:object_not_found', `User "${type}" object is not found in upload objects`);



    // Delete old object
    if (this._doc[key] !== defaultUrl) {
      try {
        await NekomiUploadService.deleteFile(NekomiUploadService.getId(this._doc[key]), this._doc.id);
      } catch (e) {
        Logger.warn(`[${this.RepositoryName}]: Cannot delete user old "${type}" (${this._doc[key]}) [id: ${this._doc.id}]`, e);
      }
    }

    this._set(key, object.url);
    await this.save();

    return object.url;
  }
}



const UserRepository = new UserRepositoryClass();

export default UserRepository;
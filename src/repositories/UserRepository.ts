import AnimeRepository from './AnimeRepository';
import DocumentDTO from '~/service/DataTransferService';
import DubberRepository from './DubberRepository';
import IUser, { IUserViewProgress, USER_LIB_TYPE, USER_RESTRICTION } from '~/intf/IUser';
import Logger from '~/service/LoggerService';
import RoleRepository from './RoleRepository';
import UnifiedRepositoryClass from './UnifiedRepository';
import conf, { TestMode } from '~/config';
import createId, { createNanoId } from '~/utils/create-id';
import mongoose, { Schema } from 'mongoose';
import { NekoError } from '~/service/ExceptionService';
import { RepositoryQueriesType } from '~/intf/types';
import { getUTC } from '~/utils/utils';



/** Repository type. Reffers to the model interface */
type RepositoryType = IUser;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ id: query }, { username: query }] };
};



const schema = new Schema<RepositoryType>({
  id: String,
  username: String,
  avatar: String,
  cover: String,

  roles: [String],
  libs: [Schema.Types.Mixed],

  total_viewtime: Number,
  view_progress: [Schema.Types.Mixed],
  dubber_team_member: String,
  telegram_id: Number,

  created_at: Date,
  updated_at: Date,
}, { strict: false, versionKey: false });

const model = mongoose.model<RepositoryType>('user', schema);



interface ICreateProps {
  /** Save the document in the database. @default true */
  saveDocument?: boolean

  /** //! Must be removed after 3.0.0 release */
  _implicitId?: string
}

interface IUpdateLibProps {
  is_public?: boolean
}



export class UserRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor() {
    super(model, queries);
  }



  get document(): RepositoryType | null {
    return this._doc ? DocumentDTO.user(this._doc, true) : null;
  }

  async save() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this.set('updated_at', getUTC().ISO);
    await this.update();

    Logger.debug(`[UserRepository]: Document saved. [id: ${this._doc.id}; diff: ${this.diff.join('; ')}]`);
  }



  /**
   * Create new user document
   */
  async create(props?: ICreateProps): Promise<IUser> {
    const saveDocument = props?.saveDocument ?? true;

    const id = props?._implicitId ? props?._implicitId : TestMode ? `~testing-${createNanoId()}` : createId();

    const payload: RepositoryType = {
      id,
      username: `user-${createNanoId()}`,
      email: `example-${createNanoId()}@nekomi.club`,

      avatar: conf.vars.defaultAvatar,
      cover: conf.vars.defaultBanner,

      roles: ['user'],
      libs: [
        { id: createId(), anime_ids: [], type: USER_LIB_TYPE.FAVORITE, is_public: true, created_at: getUTC().ISO },
        { id: createId(), anime_ids: [], type: USER_LIB_TYPE.PLANS, is_public: false, created_at: getUTC().ISO },
        { id: createId(), anime_ids: [], type: USER_LIB_TYPE.WATCHED, is_public: true, created_at: getUTC().ISO },
        { id: createId(), anime_ids: [], type: USER_LIB_TYPE.WATCHING, is_public: true, created_at: getUTC().ISO },
        { id: createId(), anime_ids: [], type: USER_LIB_TYPE.DELAYED, is_public: false, created_at: getUTC().ISO },
      ],
      restrictions: [],
      sessions: [],

      total_viewtime: 0,
      view_progress: [],
      dubber_team_member: null,
      telegram_id: null,

      created_at: getUTC().ISO,
      updated_at: getUTC().ISO,
      username_changed_at: '',
    };

    const document = new model(payload);
    if (saveDocument) await document.save();

    Logger.info(`[UserRepository]: New document has been created! [id: ${id}]`);
    this._doc = document;

    return DocumentDTO.user(payload, true);
  }



  /**
   * Set username
   * 
   * @testing
   */
  async setUsername(username: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Ensure username change is not restricted
    if (this._doc.restrictions.includes(USER_RESTRICTION.USERNAME_CHANGE)) throw new NekoError(`sys:action_prevented`, `Username change is restricted by the administration`);

    // Ensure that user username is not on cooldown
    const usernameTimeoutTs = getUTC(this._doc.username_changed_at).timestamp + 0;
    if (usernameTimeoutTs > getUTC().timestamp) throw new NekoError('user:username_timeout', `You can change username only after ${getUTC(usernameTimeoutTs).ISO}`);

    // TODO: Validate username & serialize

    // Ensure username is unique
    const exist = await this.safeGetOne(username);
    if (exist && exist.id !== this._doc.id) throw new NekoError('sys:already_exist', `User "@${username}" is already exist`);

    this.set('username', username);
    this.set('username_changed_at', getUTC().ISO);
  }



  /**
   * Upload avatar
   * 
   * @todo
   */
  async uploadAvatar(buffer: Buffer) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }



  /**
   * Upload cover
   * 
   * @todo
   */
  async uploadCover(buffer: Buffer) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }



  /**
   * Set email
   * 
   * @testing
   */
  async setEmail(email: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // TODO: Validate email

    const exist = await this.getOneByQuery({ email });
    if (exist && exist.id !== this._doc.id) throw new NekoError('sys:already_exist', `User with email "${email}" is already exist`);

    this.set('email', email);
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

    // TODO: Validate viewtime span

    const viewtime = this._doc.total_viewtime + sec;

    this.set('total_viewtime', viewtime);
  }



  /**
   * Set dubber team member
   * 
   * @testing
   */
  async setDubberTeamMember(id: string | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (!id?.length) id = null;

    // Ensure that dubber exist
    if (id) await DubberRepository.getOne(id);

    this.set('dubber_team_member', id);
  }



  /**
   * Set telegram id
   * 
   * @testing
   */
  setTelegramId(id: number | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this.set('telegram_id', id);
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
   * @param id Lib id
   * @testing
   */
  async appendLibAnime(id: string, animeId: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const lib = this._doc.libs.find(el => el.id === id);
    if (!lib) throw new NekoError(`sys:not_found`, `Lib "${id}" is not found`);

    const anime = await AnimeRepository.getOne(animeId);

    lib.anime_ids.push(anime.id);

    this._doc.markModified('libs');
  }



  /**
   * Remove anime document from lib
   * 
   * @param id Lib id
   * @testing
   */
  removeLibAnime(id: string, animeId: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const lib = this._doc.libs.find(el => el.id === id);
    if (!lib) throw new NekoError(`sys:not_found`, `Lib "${id}" is not found`);

    lib.anime_ids = lib.anime_ids.filter(el => el !== animeId);

    this._doc.markModified('libs');
  }



  /**
   * Append restriction
   * 
   * @testing
   */
  appendRestriction(slug: USER_RESTRICTION) {
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
  removeRestriction(slug: USER_RESTRICTION) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Pass if restriction is not assigned
    if (!this._doc.restrictions.includes(slug)) return;

    this._doc.restrictions = this._doc.restrictions.filter(el => el !== slug);
  }
}



const UserRepository = new UserRepositoryClass();

export default UserRepository;
import DubberModel from '../Models/DubberModel';
import ServiceControls from '../Interfaces/ServiceControls';
import UserModel, { UserService } from '../../Models/User';
import validator from 'validator';
import { E400, E404, ERR_FILE_TOO_LARGE, ERR_INVALID_PAYLOAD, ERR_NO_DOCUMENT } from '../../Services/ErrorService';
import { HydratedDocument } from 'mongoose';
import { IDubber, IDubberMember, TDubberMemberRole } from '../Interfaces/IDubber';
import { INotifyDubberInvite } from '../../Interfaces/services/INotify';
import { Logger } from '../../Services/LoggerService';
import { MongoDocumentDTO } from './DTO';
import { NekomiUploadsAPI } from './API/NekomiUploadsAPI';
import { Notify } from '../../Services/NotifyService';
import { TestMode, config } from '../../config';
import { createSlug, createStringID, createUUID, getUTC, trimString } from '../../handlers/handler';



interface IDubberCreateProps {
  nameUkr: string
  nameEng: string

  /** Set dubber id. Only in test mode */
  DEV_ID?: string

  TEST_MEMBERS?: IDubberMember[]
  TEST_MEMBERS_INVITED?: string[]
}

interface IDubberCRUDProps {
  TestMode?: boolean
}

interface IChangeName {
  nameEng?: string
  nameUkr?: string
}

interface IPatchLinks<K> {
  key: K,
  value: string | null
}

interface IMemberAdd {
  id: string
  /** Check if user is invited in the team. @default true */
  checkInvitation?: boolean
}

interface IMemberInvite {
  id: string
}

interface IMemberDelete {
  id: string
  /** Check if user is invited in the team. @default true */
  declineInvite?: boolean
}

interface IMemberEdit {
  id: string

  role?: TDubberMemberRole
}

interface IChangeAvatarBanner {
  file: Express.Multer.File
  userId: string
}

type TDubberModelControls = ServiceControls<IDubberCreateProps, IDubber>



const ERR_NAME_LENGTH_INVALID = new E400(`Dubber name must be in range between ${config.VALIDATION.CreateUser.minNameLength} and ${config.VALIDATION.CreateUser.maxNameLength} symbols`, 'dubber:name_length_invalid');
const ERR_NAME_NOT_LATIN = new E400(`Dubber english name must contain only latin letters`, 'dubber:name_not_latin');
const ERR_DESCRIPTION_LENGTH_INVALUD = new E400(`Description must be shorter than ${config.VALIDATION.PatchTitle.maxDescriptionLength} symbols length`, 'dubber:description_length_invalid');
const ERR_LINK_DOMAIN_MISSMATCH = new E400(`Some links points to invalid domains or link parsed with error`, 'dubber:link_domain_missmatch');

export const ERR_DUBBER_OTHER_TEAM_MEMBER = new E400(`User is already take part in another dubber team`, 'dubber:other_team_member');
export const ERR_DUBBER_NOT_INVITED = new E400(`User is not invited in this team`, 'dubber:not_invited');
export const ERR_DUBBER_ALREADY_INVITED = new E400(`User is already invited in this team`, 'dubber:already_invited');
const ERR_MEMBER_ALREADY = new E400(`User is already member of this team`, 'dubber:member_already');
const ERR_NOT_MEMBER = new E400(`User is not member in this team`, 'dubber:not_member');
const ERR_TELEGRAM_NOT_LINKED = new E400(`User does not link telegram`, 'dubber:telegram_not_linked');



// export const DUBBER_DEFAULT_INSTANCE: IDubber = {
// id: '',
// nameUkr: '',
// nameEng: '',
// name: '',
// slug: '',
// avatar: config.vars.defaultAvatar,
// banner: config.vars.defaultBanner,
// description: null,
// members: [],
// membersInvited: [],
// socials: {
//   instagram: null,
//   telegram: null,
//   tiktok: null,
//   youtube: null
// },
// support: {
//   bymeacoffee: null,
//   diaka: null,
//   monobank: null,
//   patreon: null,
//   privatbank: null
// },
// statistics: {
//   createdAt: getUTC().timestamp
// },
// createdAt: getUTC().timestamp,
// code: ''
// };



class DubberModelControls implements TDubberModelControls {
  readonly TestMode: boolean;

  constructor(props?: IDubberCRUDProps) {
    this.TestMode = props?.TestMode ?? TestMode;
  }



  async create(props: IDubberCreateProps): Promise<IDubber> {
    const { DEV_ID, TEST_MEMBERS, TEST_MEMBERS_INVITED } = props;
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



    const members = this.TestMode && TEST_MEMBERS?.length ? TEST_MEMBERS : [];
    const membersInvited = this.TestMode && TEST_MEMBERS_INVITED?.length ? TEST_MEMBERS_INVITED : [];



    const instance: IDubber = {
      id,
      nameUkr,
      nameEng,
      name: nameUkr,
      slug,
      avatar: config.vars.defaultAvatar,
      banner: config.vars.defaultBanner,
      description: null,
      members,
      membersInvited,
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

    const document = new DubberModel(instance);
    await document.save();

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

/** 
 * Brand-new implementation of database services
 * This service must be initialized by calling @method init()
*/
export class DubberService extends DubberModelControls {
  private document: HydratedDocument<IDubber> | null = null;
  private stack: string[] = [];

  async init(query: string) {
    const document = await DubberModel.findOne({ $or: [{ id: query }, { slug: query }, { code: query }] }); // Hydrated document required, find by built-in method is not possible
    if (!document) throw new E404(`Document ${query} is not found`);

    this.document = document;
  }

  /** Save the document
   * @returns current patch stack
   */
  async save(): Promise<string[]> {
    if (!this.document) throw ERR_NO_DOCUMENT;

    await this.document.save();

    Logger.debug(`[DubberService]: Document patched. [id: ${this.document.id}; changes: ${this.stack.length ? this.stack.join(', ') : 'none'}]`);

    return this.stack;
  }

  get dubber(): IDubber {
    if (!this.document) throw ERR_NO_DOCUMENT;
    return new MongoDocumentDTO().dubber({ document: this.document, details: true });
  }



  /** Changing nameEng will also change the slug */
  async changeName({ nameEng, nameUkr }: IChangeName) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    if (nameUkr !== undefined) {
      nameUkr = trimString(nameUkr);
      if (!validator.isLength(nameUkr, { min: config.VALIDATION.CreateUser.minNameLength, max: config.VALIDATION.CreateUser.maxNameLength })) throw ERR_NAME_LENGTH_INVALID;

      this.stack.push(`nameUkr: ${this.document.nameUkr} > ${nameUkr}`);

      this.document.nameUkr = nameUkr;
      this.document.name = nameUkr;
      this.document.markModified('nameUkr');
      this.document.markModified('name');
    }

    if (nameEng !== undefined) {
      nameEng = trimString(nameEng);
      if (!validator.isLength(nameEng, { min: config.VALIDATION.CreateUser.minNameLength, max: config.VALIDATION.CreateUser.maxNameLength })) throw ERR_NAME_LENGTH_INVALID;
      if (!validator.isAlpha(nameEng.replaceAll(' ', ''), 'en-US')) throw ERR_NAME_NOT_LATIN;

      let slug = createSlug(nameEng);

      const exist = await DubberModel.findOne({ slug });
      if (exist && exist.id !== this.document.id) slug = slug + `-${createStringID(3)}`;

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
      if (!validator.isLength(description, { max: config.VALIDATION.PatchTitle.maxDetailsLength })) ERR_DESCRIPTION_LENGTH_INVALUD;

      this.stack.push(`description: ${this.document.description?.length} symbols > ${description.length} symbols`);
    } else {
      description = null;

      this.stack.push(`description: ${this.document.description?.length} symbols > null`);
    }

    this.document.description = description;
    this.document.markModified('description');
  }

  async changeSocials({ key, value }: IPatchLinks<keyof IDubber['socials']>) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    value = value?.length ? value : null;
    if (value?.length && value.length > 256) throw new E400(`This link is too large (above 256 chars)`);

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

  async changeSupport({ key, value }: IPatchLinks<keyof IDubber['support']>) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    value = value?.length ? value : null;
    if (value?.length && value.length > 256) throw new E400(`This link is too large (above 256 chars)`);

    try {

      if (value !== null) {
        const { host } = new URL(value);

        if (key === 'bymeacoffee' && host !== 'buymeacoffee.com') throw null;
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



  /** Add member into the team. Will save the document and remove the invitation */
  async memberAdd({ id, checkInvitation }: IMemberAdd) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    checkInvitation = checkInvitation ?? true;

    const user = await UserModel.findOne({ id });
    if (!user) throw new E404(`User ${id} is not found`);
    if (user.statistics.dubber_team_member && user.statistics.dubber_team_member === this.document.id) throw ERR_MEMBER_ALREADY;
    if (user.statistics.dubber_team_member && user.statistics.dubber_team_member !== this.document.id) throw ERR_DUBBER_OTHER_TEAM_MEMBER;
    if (checkInvitation && !this.document.membersInvited.includes(id)) throw ERR_DUBBER_NOT_INVITED;

    Logger.info(`[DubberService]: Adding user to the dubber team... [userId: ${id}; dubberId: ${this.document.id}]`);

    //* Send notification
    const userService = new UserService({ user });
    await userService.addSubscribe({ event: 'dubber_invite_accepted', key: this.document.id });
    await userService.save();

    if (!this.TestMode) {
      try {
        await Notify.broadcast<INotifyDubberInvite>({
          event: 'dubber_invite_accepted',
          payload: {
            user_id: id,
            dubber_id: this.document.id
          }
        });
      } catch (e) {
        Logger.fail(`[DubberService]: Can not send dubber_invite_accepted notification`, e);
      }
    } else {
      Logger.debug(`[DubberService]: Notify dubber_invite_accepted has been silenced due to Testing mode`);
    }

    await userService.patchStatistics({ dubber_team_member: this.document.id });
    await userService.addRole({ code: 'dubber_member' });
    await userService.removeSubscribe({ event: 'dubber_invite_accepted', key: this.document.id });
    await userService.removeSubscribe({ event: 'dubber_invite_pending', key: this.document.id });
    await userService.save();

    //* Remove the invite and add user as a member
    this.document.membersInvited = this.document.membersInvited.filter(el => el !== id);
    this.document.members.push({
      id,
      memberSince: getUTC().timestamp,
      role: 'member',
    });

    this.document.markModified('members');
    this.document.markModified('membersInvited');

    //* Write logs
    this.stack.push(`user ${id} added to the team`);
    Logger.info(`[DubberService]: User has been added to the dubber team. [userId: ${id}; dubberId: ${this.document.id}]`);

    await this.save();
  }

  /** Edit team member */
  async memberEdit({ id, role }: IMemberEdit) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    const user = await UserModel.findOne({ id });
    if (!user) throw new E404(`User ${id} is not found`);

    const member = this.document.members.find(el => el.id === id);
    if (!member) throw ERR_NOT_MEMBER;

    const userService = new UserService({ user });

    //* Edit role
    if (role !== undefined) {
      const prevRole = member.role;

      if (role === 'member') {
        await userService.addRole({ code: `dubber_member` });
        await userService.removeRole({ code: `dubber_editor` });
        await userService.removeRole({ code: `dubber_leader` });
      } else if (role === 'editor') {
        await userService.addRole({ code: `dubber_editor` });
        await userService.removeRole({ code: `dubber_member` });
        await userService.removeRole({ code: `dubber_leader` });
      } else if (role === 'leader') {
        await userService.addRole({ code: `dubber_leader` });
        await userService.removeRole({ code: `dubber_member` });
        await userService.removeRole({ code: `dubber_editor` });
      } else {
        throw new ERR_INVALID_PAYLOAD(`Role ${role} is invalid to patch`);
      }

      member.role = role;
      this.document.markModified('members');

      //* Write logs
      this.stack.push(`user ${id} role has been changed ${prevRole} > ${role}`);
      Logger.debug(`[DubberService]: User role has been changed ${prevRole} > ${role}. [userId: ${id}; dubberId: ${this.document.id}]`);

      await userService.save();
    }
  }

  /** Delete member / invitation. Will save the document */
  async memberDelete({ id, declineInvite }: IMemberDelete) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    declineInvite = declineInvite ?? true;

    const user = await UserModel.findOne({ id });
    if (!user) throw new E404(`User ${id} is not found`);
    if (declineInvite && !this.document.membersInvited.includes(id)) throw ERR_DUBBER_NOT_INVITED;
    if (!declineInvite && !this.document.members.some(el => el.id === id)) throw new E404(`User ${id} is not found in this team`);

    Logger.info(`[DubberService]: Deleting user from the dubber team... [userId: ${id}; dubberId: ${this.document.id}]`);

    const userService = new UserService({ user });

    if (declineInvite) {
      //* Send notification about declined invite
      await userService.addSubscribe({ event: 'dubber_invite_declined', key: this.document.id });
      await userService.save();

      if (!this.TestMode) {
        try {
          await Notify.broadcast<INotifyDubberInvite>({
            event: 'dubber_invite_declined', payload: {
              user_id: id,
              dubber_id: this.document.id
            }
          });
        } catch (e) {
          Logger.fail(`[DubberService]: Can not send dubber_invite_declined notify`, e);
        }
      } else {
        Logger.debug(`[DubberService]: Notify dubber_invite_declined has been silenced due to Testing mode`);
      }

      await userService.removeSubscribe({ event: 'dubber_invite_declined', key: this.document.id });
      await userService.removeSubscribe({ event: 'dubber_invite_pending', key: this.document.id });
    } else {
      //* Send notification about excluding from the team
      await userService.addSubscribe({ event: 'dubber_member_excluded', key: this.document.id });
      await userService.save();

      if (!this.TestMode) {
        try {
          await Notify.broadcast<INotifyDubberInvite>({
            event: 'dubber_member_excluded', payload: {
              user_id: id,
              dubber_id: this.document.id
            }
          });
        } catch (e) {
          Logger.fail(`[DubberService]: Can not send dubber_invite_declined notify`, e);
        }
      } else {
        Logger.debug(`[DubberService]: Notify dubber_member_excluded has been silenced due to Testing mode`);
      }

      await userService.patchStatistics({ dubber_team_member: null });
      await userService.removeSubscribe({ event: 'dubber_member_excluded', key: this.document.id });
      await userService.removeRole({ code: 'dubber_member' });
      await userService.removeRole({ code: 'dubber_editor' });
      await userService.removeRole({ code: 'dubber_leader' });
    }

    await userService.save();

    //* Remove member
    this.document.members = this.document.members.filter(el => el.id !== id);
    this.document.membersInvited = this.document.membersInvited.filter(el => el !== id);

    this.document.markModified('members');
    this.document.markModified('membersInvited');

    //* Write logs
    this.stack.push(`user ${id} deleted from the team`);
    Logger.info(`[DubberService]: User has been deleted from the team. [userId: ${id}; dubberId: ${this.document.id}]`);

    await this.save();
  }

  /** Invite member into the team. Will save the document */
  async memberInvite({ id }: IMemberInvite) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    const user = await UserModel.findOne({ id });
    if (!user) throw new E404(`User ${id} is not found`);
    if (user.statistics.dubber_team_member && user.statistics.dubber_team_member === this.document.id) throw ERR_MEMBER_ALREADY;
    if (user.statistics.dubber_team_member && user.statistics.dubber_team_member !== this.document.id) throw ERR_DUBBER_OTHER_TEAM_MEMBER;
    if (this.document.membersInvited.includes(id)) throw ERR_DUBBER_ALREADY_INVITED;
    if (!user.statistics.isTelegramLinked) throw ERR_TELEGRAM_NOT_LINKED;

    Logger.info(`[DubberService]: Inviting user to the dubber team... [userId: ${id}; dubberId: ${this.document.id}]`);

    //* Send invite notify
    const userService = new UserService({ user });
    await userService.addSubscribe({ event: 'dubber_invite_pending', key: this.dubber.id });
    await userService.save();

    if (!this.TestMode) {
      try {
        await Notify.broadcast<INotifyDubberInvite>({
          event: 'dubber_invite_pending',
          payload: {
            user_id: id,
            dubber_id: this.dubber.id
          }
        });
      } catch (e) {
        Logger.fail(`[DubberService]: Can not send dubber_invite_pending notify`, e);
      }
    } else {
      Logger.debug(`[DubberService]: Notify dubber_invite_pending has been silenced due to Testing mode`);
    }

    //* Add invite
    this.document.membersInvited.push(id);
    this.document.markModified('membersInvited');

    //* Write logs
    this.stack.push(`user ${id} invited to the team`);
    Logger.info(`[DubberService]: User has been invited to the dubber team. [userId: ${id}; dubberId: ${this.document.id}]`);

    await this.save();
  }



  /** Change dubber avatar. Will save the document */
  async changeAvatar({ file, userId }: IChangeAvatarBanner) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    if (file.size > config.VALIDATION.User.MaximumAvatarSize) throw ERR_FILE_TOO_LARGE;

    const prevAvatarId = NekomiUploadsAPI.getUploadIdFromURL(this.document.avatar);

    const { id, url } = await NekomiUploadsAPI.uploadFile({ file, type: 'photo/user/avatar', uploadedById: userId });

    this.document.avatar = url;
    this.document.markModified('avatar');

    this.document.save();

    Logger.debug(`[DubberService]: New avatar has been uploaded. [uploadId: ${id}; dubberId: ${this.document.id}]`);

    // Delete old avatar if it is not default
    if (this.document.avatar !== config.vars.defaultAvatar) {
      await NekomiUploadsAPI.deleteUpload({ id: prevAvatarId, deletedById: userId });

      Logger.debug(`[DubberService]: Old avatar deleted due to it's change. [uploadId: ${prevAvatarId}; dubberId: ${this.document.id}]`);
    }

    return { url };
  }

  /** Change dubber banner. Will save the document */
  async changeBanner({ file, userId }: IChangeAvatarBanner) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    if (file.size > config.VALIDATION.User.MaximumBannerSize) throw ERR_FILE_TOO_LARGE;

    const prevBannerId = NekomiUploadsAPI.getUploadIdFromURL(this.document.avatar);

    const { id, url } = await NekomiUploadsAPI.uploadFile({ file, type: 'photo/user/banner', uploadedById: userId });

    this.document.banner = url;
    this.document.markModified('banner');

    this.document.save();

    Logger.debug(`[DubberService]: New banner has been uploaded. [uploadId: ${id}; dubberId: ${this.document.id}]`);

    // Delete old banner if it is not default
    if (this.document.banner !== config.vars.defaultBanner) {
      await NekomiUploadsAPI.deleteUpload({ id: prevBannerId, deletedById: userId });

      Logger.debug(`[DubberService]: Old banner deleted due to it's change. [uploadId: ${prevBannerId}; dubberId: ${this.document.id}]`);
    }

    return { url };
  }
}



export default DubberService;
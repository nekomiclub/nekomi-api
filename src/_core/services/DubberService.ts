import validator from 'validator';
import { HydratedDocument } from 'mongoose';

import DocumentDTO from './DTOService';
import DubberModel from '~/core/models/DubberModel';
import Search from '~/services/SearchService';
import UserModel, { UserService } from '~/models/User';
import { Dubber, DubberMember, DubberRoleType } from '~/core/interfaces/Dubber.intf';
import { E404, ERR_DESCRIPTION_LENGTH_INVALID, ERR_DUBBER_ALREADY_INVITED, ERR_DUBBER_MEMBER_ALREADY, ERR_DUBBER_NOT_INVITED, ERR_DUBBER_NOT_MEMBER, ERR_DUBBER_OTHER_TEAM_MEMBER, ERR_FILE_TOO_LARGE, ERR_INVALID_PAYLOAD, ERR_LINK_INVALID, ERR_USERNAME_LENGTH_INVALID, ERR_USERNAME_NOT_LATIN, ERR_USER_TELEGRAM_NOT_LINKED } from '~/services/ErrorService';
import { ERROR_DUBBER_NOT_FOUND, ERROR_NO_DOCUMENT } from '~/services/Exceptions';
import { Logger } from '~/services/LoggerService';
import { NOTIFY_EVENT, Notify, NotifyDubberTellProps } from '~/services/NotifyService';
import { NekomiUploads } from './API/NekomiUploads.api';
import { ServiceControls } from '~/core/interfaces/types';
import { TestMode, config } from '~/config';
import { createSlug } from '~/utils/utils';
import { createStringID } from '~/utils/utils';
import { createUUID } from '~/utils/utils';
import { getUTC } from '~/utils/utils';
import { trimString } from '~/utils/utils';



interface DubberCreateProps {
  nameUkr: string
  nameEng: string

  /** Set dubber id. Only in test mode */
  DEV_ID?: string

  TEST_MEMBERS?: DubberMember[]
  TEST_MEMBERS_INVITED?: string[]
}

interface DubberCRUDProps {
  TestMode?: boolean
}

interface ChangeName {
  nameEng?: string
  nameUkr?: string
}

interface PatchLinks<K> {
  key: K,
  value: string | null
}

interface MemberAdd {
  id: string
  /** Check if user is invited in the team. @default true */
  checkInvitation?: boolean
}

interface MemberInvite {
  id: string
}

interface MemberDelete {
  id: string
  /** Check if user is invited in the team. @default true */
  declineInvite?: boolean
}

interface MemberEdit {
  id: string

  role?: DubberRoleType
}

interface ChangeAvatarBanner {
  file: Express.Multer.File
  userId: string
}

type DubberModelControlsType = ServiceControls<DubberCreateProps, Dubber>



class DubberModelControls implements DubberModelControlsType {
  readonly TestMode: boolean;

  constructor(props?: DubberCRUDProps) {
    this.TestMode = props?.TestMode ?? TestMode;
  }



  async create(props: DubberCreateProps): Promise<Dubber> {
    const { DEV_ID, TEST_MEMBERS, TEST_MEMBERS_INVITED } = props;
    let { nameUkr, nameEng } = props;

    nameUkr = trimString(nameUkr);
    nameEng = trimString(nameEng);

    if (!validator.isLength(nameUkr, { min: config.VALIDATION.CreateUser.minNameLength, max: config.VALIDATION.CreateUser.maxNameLength })) throw ERR_USERNAME_LENGTH_INVALID;
    if (!validator.isLength(nameEng, { min: config.VALIDATION.CreateUser.minNameLength, max: config.VALIDATION.CreateUser.maxNameLength })) throw ERR_USERNAME_LENGTH_INVALID;
    if (!validator.isAlpha(nameEng.replaceAll(' ', ''), 'en-US')) throw ERR_USERNAME_NOT_LATIN;

    const id = this.TestMode && DEV_ID ? DEV_ID : this.TestMode ? `~test-${createUUID()}` : createUUID();
    const createdAt = getUTC().timestamp;
    let slug = createSlug(nameEng);

    const exist = await DubberModel.findOne({ slug });
    if (exist) slug = slug + `-${createStringID(3)}`;



    const members = this.TestMode && TEST_MEMBERS?.length ? TEST_MEMBERS : [];
    const membersInvited = this.TestMode && TEST_MEMBERS_INVITED?.length ? TEST_MEMBERS_INVITED : [];



    const instance: Dubber = {
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

    Logger.info(`[DubberService]: New document was created. [id: ${id}]`);

    return instance;
  }

  async deleteOne(id: string): Promise<void> {
    await DubberModel.deleteOne({ id });

    Logger.info(`[DubberService]: Single document was deleted. [id: ${id}]`);
  }

  async deleteMany(id: string): Promise<void> {
    const details = await DubberModel.deleteMany({ id });

    Logger.info(`[DubberService]: Some document were deleted. [id: ${id}; count: ${details.deletedCount}]`);
  }

  async getAll(details?: boolean): Promise<Dubber[]> {
    const total = await DubberModel.find();
    const list = total.map(document => {
      return DocumentDTO.dubber(document, details);
    });

    return list;
  }

  async getById(id: string, details?: boolean): Promise<Dubber> {
    const document = await DubberModel.findOne({ id });
    if (!document) throw ERROR_DUBBER_NOT_FOUND;

    return DocumentDTO.dubber(document, details);
  }

  async getByQuery(query: string, details?: boolean): Promise<Dubber> {
    const document = await DubberModel.findOne({ $or: [{ id: query }, { slug: query }] });
    if (!document) throw ERROR_DUBBER_NOT_FOUND;

    return DocumentDTO.dubber(document, details);
  }

  async safeGetByQuery(query: string, details?: boolean): Promise<Dubber | null> {
    try {
      return await this.getByQuery(query, details);
    } catch (e) { return null; }
  }
}

/** 
 * Brand-new implementation of database services
 * This service must be initialized by calling @method init()
*/
export class DubberService extends DubberModelControls {
  private document: HydratedDocument<Dubber> | null = null;
  private stack: string[] = [];

  async init(query: string) {
    const document = await DubberModel.findOne({ $or: [{ id: query }, { slug: query }, { code: query }] }); // Hydrated document required, find by built-in method is not possible
    if (!document) throw ERROR_DUBBER_NOT_FOUND;

    this.document = document;
  }

  /** Save the document
   * @returns current patch stack
   */
  async save(): Promise<string[]> {
    if (!this.document) throw ERROR_NO_DOCUMENT;

    try {
      await this.document.save();
    } catch (error) {
      Logger.debug(`[DubberService]: Cannot save the document. Retrying after 1 second...`);

      await new Promise(res => {
        setTimeout(() => {
          res(1);
        }, 1000);
      });

      try {
        await this.document.save();
      } catch (e) {
        Logger.error(`[DubberService]: Cannot save the document`, e);

        const stack = this.stack;
        this.stack = [];

        return stack;
      }
    }

    Logger.debug(`[DubberService]: Document patched. [id: ${this.document.id}; changes: ${this.stack.length ? this.stack.join(', ') : 'none'}]`);

    this.stack = [];
    return this.stack;
  }

  get dubber(): Dubber {
    if (!this.document) throw ERROR_NO_DOCUMENT;
    return DocumentDTO.dubber(this.document, true);
  }



  /** Changing nameEng will also change the slug */
  async changeName({ nameEng, nameUkr }: ChangeName) {
    if (!this.document) throw ERROR_NO_DOCUMENT;

    if (nameUkr !== undefined) {
      nameUkr = trimString(nameUkr);
      if (!validator.isLength(nameUkr, { min: config.VALIDATION.CreateUser.minNameLength, max: config.VALIDATION.CreateUser.maxNameLength })) throw ERR_USERNAME_LENGTH_INVALID;

      this.stack.push(`nameUkr: ${this.document.nameUkr} > ${nameUkr}`);

      this.document.nameUkr = nameUkr;
      this.document.name = nameUkr;
      this.document.markModified('nameUkr');
      this.document.markModified('name');
    }

    if (nameEng !== undefined) {
      nameEng = trimString(nameEng);
      if (!validator.isLength(nameEng, { min: config.VALIDATION.CreateUser.minNameLength, max: config.VALIDATION.CreateUser.maxNameLength })) throw ERR_USERNAME_LENGTH_INVALID;
      if (!validator.isAlpha(nameEng.replaceAll(' ', ''), 'en-US')) throw ERR_USERNAME_NOT_LATIN;

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
    if (!this.document) throw ERROR_NO_DOCUMENT;

    if (description?.length) {
      description = trimString(description);
      if (!validator.isLength(description, { max: config.VALIDATION.PatchTitle.maxDetailsLength })) ERR_DESCRIPTION_LENGTH_INVALID;

      this.stack.push(`description: ${this.document.description?.length} symbols > ${description.length} symbols`);
    } else {
      description = null;

      this.stack.push(`description: ${this.document.description?.length} symbols > null`);
    }

    this.document.description = description;
    this.document.markModified('description');
  }

  async changeSocials({ key, value }: PatchLinks<keyof Dubber['socials']>) {
    if (!this.document) throw ERROR_NO_DOCUMENT;

    value = value?.length ? value : null;
    if (value?.length && value.length > 256) throw ERR_LINK_INVALID;

    try {
      if (value !== null) {
        const { host } = new URL(value);

        if (key === 'instagram' && host !== 'instagram.com') throw null;
        if (key === 'telegram' && host !== 't.me') throw null;
        if (key === 'tiktok' && host !== 'tiktok.com') throw null;
        if (key === 'youtube' && host !== 'youtube.com') throw null;
      }
    } catch (e) {
      throw ERR_LINK_INVALID;
    }

    this.stack.push(`social ${key}: ${this.document.socials[key]} > ${value}`);

    this.document.socials[key] = value;
    this.document.markModified('socials');
  }

  async changeSupport({ key, value }: PatchLinks<keyof Dubber['support']>) {
    if (!this.document) throw ERROR_NO_DOCUMENT;

    value = value?.length ? value : null;
    if (value?.length && value.length > 256) throw ERR_LINK_INVALID;

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
      throw ERR_LINK_INVALID;
    }

    this.stack.push(`support ${key}: ${this.document.support[key]} > ${value}`);

    this.document.support[key] = value;
    this.document.markModified('support');
  }



  /** Add member into the team. Will save the document and remove the invitation */
  async memberAdd({ id, checkInvitation }: MemberAdd) {
    if (!this.document) throw ERROR_NO_DOCUMENT;

    checkInvitation = checkInvitation ?? true;

    const user = await UserModel.findOne({ id });
    if (!user) throw new E404(`User ${id} is not found`);
    if (user.statistics.dubber_team_member && user.statistics.dubber_team_member === this.document.id) throw ERR_DUBBER_MEMBER_ALREADY;
    if (user.statistics.dubber_team_member && user.statistics.dubber_team_member !== this.document.id) throw ERR_DUBBER_OTHER_TEAM_MEMBER;
    if (checkInvitation && !this.document.membersInvited.includes(id)) throw ERR_DUBBER_NOT_INVITED;

    Logger.info(`[DubberService]: Adding user to the dubber team... [userId: ${id}; dubberId: ${this.document.id}]`);

    //* Send notification
    const userService = new UserService({ user });
    await userService.addSubscribe({ event: NOTIFY_EVENT.DUBBER_INVITE_ACCEPTED, key: this.document.id });
    await userService.save();

    if (!this.TestMode) {
      try {
        await Notify.broadcast<NotifyDubberTellProps>({
          event: NOTIFY_EVENT.DUBBER_INVITE_ACCEPTED,
          payload: {
            userId: id,
            dubberId: this.document.id
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
    await userService.removeSubscribe({ event: NOTIFY_EVENT.DUBBER_INVITE_ACCEPTED, key: this.document.id });
    await userService.removeSubscribe({ event: NOTIFY_EVENT.DUBBER_INVITE_PENDING, key: this.document.id });
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

    await Search.update('user');
    await this.save();
  }

  /** Edit team member */
  async memberEdit({ id, role }: MemberEdit) {
    if (!this.document) throw ERROR_NO_DOCUMENT;

    const user = await UserModel.findOne({ id });
    if (!user) throw new E404(`User ${id} is not found`);

    const member = this.document.members.find(el => el.id === id);
    if (!member) throw ERR_DUBBER_NOT_MEMBER;

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
  async memberDelete({ id, declineInvite }: MemberDelete) {
    if (!this.document) throw ERROR_NO_DOCUMENT;

    declineInvite = declineInvite ?? true;

    const user = await UserModel.findOne({ id });
    if (!user) throw new E404(`User ${id} is not found`);
    if (declineInvite && !this.document.membersInvited.includes(id)) throw ERR_DUBBER_NOT_INVITED;
    if (!declineInvite && !this.document.members.some(el => el.id === id)) throw new E404(`User ${id} is not found in this team`);

    Logger.info(`[DubberService]: Deleting user from the dubber team... [userId: ${id}; dubberId: ${this.document.id}]`);

    const userService = new UserService({ user });

    if (declineInvite) {
      //* Send notification about declined invite
      await userService.addSubscribe({ event: NOTIFY_EVENT.DUBBER_INVITE_DECLINED, key: this.document.id });
      await userService.save();

      if (!this.TestMode) {
        try {
          await Notify.broadcast<NotifyDubberTellProps>({
            event: NOTIFY_EVENT.DUBBER_INVITE_DECLINED, payload: {
              userId: id,
              dubberId: this.document.id
            }
          });
        } catch (e) {
          Logger.fail(`[DubberService]: Can not send dubber_invite_declined notify`, e);
        }
      } else {
        Logger.debug(`[DubberService]: Notify dubber_invite_declined has been silenced due to Testing mode`);
      }

      await userService.removeSubscribe({ event: NOTIFY_EVENT.DUBBER_INVITE_DECLINED, key: this.document.id });
      await userService.removeSubscribe({ event: NOTIFY_EVENT.DUBBER_INVITE_PENDING, key: this.document.id });
    } else {
      //* Send notification about excluding from the team
      await userService.addSubscribe({ event: NOTIFY_EVENT.DUBBER_MEMBER_EXCLUDED, key: this.document.id });
      await userService.save();

      if (!this.TestMode) {
        try {
          await Notify.broadcast<NotifyDubberTellProps>({
            event: NOTIFY_EVENT.DUBBER_MEMBER_EXCLUDED, payload: {
              userId: id,
              dubberId: this.document.id
            }
          });
        } catch (e) {
          Logger.fail(`[DubberService]: Can not send dubber_invite_declined notify`, e);
        }
      } else {
        Logger.debug(`[DubberService]: Notify dubber_member_excluded has been silenced due to Testing mode`);
      }

      await userService.patchStatistics({ dubber_team_member: null });
      await userService.removeSubscribe({ event: NOTIFY_EVENT.DUBBER_MEMBER_EXCLUDED, key: this.document.id });
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

    await Search.update('user');
    await this.save();
  }

  /** Invite member into the team. Will save the document */
  async memberInvite({ id }: MemberInvite) {
    if (!this.document) throw ERROR_NO_DOCUMENT;

    const user = await UserModel.findOne({ id });
    if (!user) throw new E404(`User ${id} is not found`);
    if (user.statistics.dubber_team_member && user.statistics.dubber_team_member === this.document.id) throw ERR_DUBBER_MEMBER_ALREADY;
    if (user.statistics.dubber_team_member && user.statistics.dubber_team_member !== this.document.id) throw ERR_DUBBER_OTHER_TEAM_MEMBER;
    if (this.document.membersInvited.includes(id)) throw ERR_DUBBER_ALREADY_INVITED;
    if (!user.statistics.isTelegramLinked) throw ERR_USER_TELEGRAM_NOT_LINKED;

    Logger.info(`[DubberService]: Inviting user to the dubber team... [userId: ${id}; dubberId: ${this.document.id}]`);

    //* Send invite notify
    const userService = new UserService({ user });
    await userService.addSubscribe({ event: NOTIFY_EVENT.DUBBER_INVITE_PENDING, key: this.dubber.id });
    await userService.save();

    if (!this.TestMode) {
      try {
        await Notify.broadcast<NotifyDubberTellProps>({
          event: NOTIFY_EVENT.DUBBER_INVITE_PENDING,
          payload: {
            userId: id,
            dubberId: this.dubber.id
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

    await Search.update('user');
    await this.save();
  }



  /** Change dubber avatar. Will save the document */
  async changeAvatar({ file, userId }: ChangeAvatarBanner) {
    if (!this.document) throw ERROR_NO_DOCUMENT;
    if (file.size > config.VALIDATION.User.MaximumAvatarSize) throw ERR_FILE_TOO_LARGE;

    const prevAvatarId = NekomiUploads.getUploadIdFromURL(this.document.avatar);

    const { id, url } = await NekomiUploads.uploadFile({ file, type: 'photo/user/avatar', uploadedById: userId });

    this.document.avatar = url;
    this.document.markModified('avatar');

    this.document.save();

    Logger.debug(`[DubberService]: New avatar has been uploaded. [uploadId: ${id}; dubberId: ${this.document.id}]`);

    // Delete old avatar if it is not default
    if (this.document.avatar !== config.vars.defaultAvatar) {
      await NekomiUploads.deleteUpload({ id: prevAvatarId, deletedById: userId });

      Logger.debug(`[DubberService]: Old avatar deleted due to it's change. [uploadId: ${prevAvatarId}; dubberId: ${this.document.id}]`);
    }

    return { url };
  }

  /** Change dubber banner. Will save the document */
  async changeBanner({ file, userId }: ChangeAvatarBanner) {
    if (!this.document) throw ERROR_NO_DOCUMENT;
    if (file.size > config.VALIDATION.User.MaximumBannerSize) throw ERR_FILE_TOO_LARGE;

    const prevBannerId = NekomiUploads.getUploadIdFromURL(this.document.banner);

    const { id, url } = await NekomiUploads.uploadFile({ file, type: 'photo/user/banner', uploadedById: userId });

    this.document.banner = url;
    this.document.markModified('banner');

    this.document.save();

    Logger.debug(`[DubberService]: New banner has been uploaded. [uploadId: ${id}; dubberId: ${this.document.id}]`);

    // Delete old banner if it is not default
    if (this.document.banner !== config.vars.defaultBanner) {
      await NekomiUploads.deleteUpload({ id: prevBannerId, deletedById: userId });

      Logger.debug(`[DubberService]: Old banner deleted due to it's change. [uploadId: ${prevBannerId}; dubberId: ${this.document.id}]`);
    }

    return { url };
  }
}



export default DubberService;
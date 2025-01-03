import mongoose, { HydratedDocument, Schema } from 'mongoose';
import validator from 'validator';
import { convert as createSlug } from 'url-slug';

import UserModel, { UserService } from './User';
import { E400, E404, ERR_ALREADY_EXIST, ERR_INVALID_PAYLOAD, ERR_LENGTH_INVALID } from '../services/ErrorService';
import { IDubber, TDubberMemberRole } from '../interfaces/Dubber';
import { INotifyDubberInvite } from '../interfaces/services/Notify';
import { Logger } from '../services/LoggerService';
import { Notify } from '../services/NotifyService';
import { config, prodMode } from '../config';
import { createID, getUTC } from '../handlers/handler';



interface IDubberCreate {
  nameUkr: string
  nameEng: string

  /** Id can be set only in dev mode */
  id?: string
}

interface IDubberServiceProps {
  dubber: HydratedDocument<IDubber>;
}

interface IPatchName {
  ukr?: string
  eng?: string
}

type TPatchStatistics = IDubber['statistics']

interface IPatchSocialLink {
  key: keyof IDubber['socials'],
  value: string | null
}

interface IPatchSupportlLink {
  key: keyof IDubber['support'],
  value: string | null
}

interface IMemberEdit {
  id: string
  role?: TDubberMemberRole
}

/** To create/patch/delete Dubber instance use DubberService */
export const DubberModel = mongoose.model<IDubber>('dubber', new Schema({
  id: String,
  code: String,
  name: String,
  socials: Object,
  support: Object,
  createdAt: Number,
  description: String,
  members: Array,
  avatar: String,
  membersInvited: Array,
  statistics: Object,
  nameEng: String,
  nameUkr: String,
  slug: String,
  banner: String
}));

//! ---------- ERRORS
const ERR_NOT_INVITED = new E400('User not invited in that team', 'dubber_member:not_invited');
const ERR_NOT_MEMBER = new E400('User not member in that team', 'dubber_member:not_member');
const ERR_TELEGRAM_MISS = new E400('User does not link telegram', 'dubber_member:telegram_miss');

const ERR_INVITED_ALREADY = new E400('User is already invited in that team', 'dubber_member:invited_already');
const ERR_MEMBER_ALREADY = new E400('User is already member of that team', 'dubber_member:member_already');
const ERR_OTHER_TEAM_MEMBER = new E400('User is already member of other team', 'dubber_member:other_team_member');



/** Create/path/delete Dubber instance */
export class DubberService {
  readonly dubber: HydratedDocument<IDubber>;
  readonly stack: string[] = [];
  readonly validation = config.VALIDATION;

  constructor({ dubber }: IDubberServiceProps) {
    this.dubber = dubber;
  }



  /** Crete new Dubber instance */
  static async create({ nameUkr, nameEng, id }: IDubberCreate): Promise<HydratedDocument<IDubber>> {
    id = prodMode ? createID() : id ?? createID();
    const slug = createSlug(nameEng);

    if (!validator.isLength(nameUkr, { max: config.VALIDATION.CreateUser.maxNameLength, min: config.VALIDATION.CreateUser.minNameLength })) throw new ERR_LENGTH_INVALID(`Ukr name length is not valid`);
    if (!validator.isLength(nameEng, { max: config.VALIDATION.CreateUser.maxNameLength, min: config.VALIDATION.CreateUser.minNameLength })) throw new ERR_LENGTH_INVALID(`Eng name length is not valid`);
    if (!validator.isLength(slug, { max: config.VALIDATION.CreateUser.maxNameLength, min: config.VALIDATION.CreateUser.minNameLength })) throw new ERR_LENGTH_INVALID(`Code length is not valid`);

    const existDubber = await DubberModel.findOne({ slug });
    if (existDubber) throw new ERR_ALREADY_EXIST(`Dubber ${slug} already exist`);

    const payload: IDubber = {
      id,
      name: nameUkr,
      nameUkr,
      nameEng,
      code: slug,
      slug,
      avatar: config.vars.defaultAvatar,
      banner: config.vars.defaultBanner,
      createdAt: getUTC().timestamp,
      description: null,
      members: [],
      membersInvited: [],
      statistics: {
        createdAt: getUTC().timestamp
      },
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
    };

    const instance = new DubberModel(payload);
    await instance.save();

    Logger.debug(`[DubberService]: New dubber ${nameUkr} created with id ${payload.id}`);

    return instance;
  }

  static async delete(id: string, reason?: string, size?: 'one' | 'many') {
    if (size === undefined || size === 'one') {
      await DubberModel.deleteOne({ id });
    } else if (size === 'many') {
      await DubberModel.deleteMany({ id });
    }

    Logger.debug(`[DubberService]: Deleted dubber with id ${id}. Reason - ${reason || 'Not provided'}`);
  }

  /** Save the document
   * @returns current patch stack
   */
  async save(): Promise<string[]> {
    await this.dubber.save();

    Logger.debug(`[DubberService]: Dubber ${this.dubber.id} patched! Stack - ${this.stack.length ? this.stack.join('; ') : 'Nothing patched...'}`);

    return this.stack;
  }



  async patchDescription(description: string) {
    const trimmed = description.trim().replace(/\s+/g, ' ');
    if (!validator.isLength(trimmed, { max: config.VALIDATION.PatchTitle.maxDescriptionLength })) throw new ERR_LENGTH_INVALID(`Description must be shorter than ${config.VALIDATION.PatchTitle.maxDescriptionLength} symbols length`);

    this.stack.push(`Changed description (${this.dubber.description?.length} symbols > ${trimmed.length} symbols)`);

    this.dubber.description = trimmed;
    this.dubber.markModified('description');
  }

  /** Changing english name will also change slug */
  async patchName({ eng, ukr }: IPatchName) {
    if (ukr) {
      const trimmed = ukr.trim().replace(/\s+/g, ' ');
      if (!validator.isLength(trimmed, { min: this.validation.CreateUser.minNameLength, max: this.validation.CreateUser.maxNameLength })) throw new ERR_INVALID_PAYLOAD(`Dubber ukr name must be between ${this.validation.CreateUser.minNameLength} and ${this.validation.CreateUser.maxNameLength} symbols length`);

      this.stack.push(`Ukr name changed (${this.dubber.nameUkr} > ${trimmed})`);

      this.dubber.nameUkr = trimmed;
      this.dubber.markModified('nameUkr');
    }

    if (eng) {
      const trimmed = eng.trim().replace(/\s+/g, ' ');
      if (!validator.isLength(trimmed, { min: this.validation.CreateUser.minNameLength, max: this.validation.CreateUser.maxNameLength })) throw new ERR_INVALID_PAYLOAD(`Dubber eng name must be between ${this.validation.CreateUser.minNameLength} and ${this.validation.CreateUser.maxNameLength} symbols length`);

      const slug = createSlug(trimmed, {
        camelCase: true,
        separator: '-'
      });

      const exist = await DubberModel.find({ slug });
      if (exist) throw new ERR_ALREADY_EXIST(`Dubber with this english name (${slug}) is already exist`);

      this.stack.push(`Eng name changed (${this.dubber.nameEng} > ${trimmed})`);
      this.stack.push(`Slug changed (${this.dubber.slug} > ${slug})`);

      this.dubber.nameEng = trimmed;
      this.dubber.slug = slug;
      this.dubber.code = slug;

      this.dubber.markModified('nameEng');
      this.dubber.markModified('slug');
    }
  }

  /** Add member to the team and remove the invitation. Will save the document */
  async addMember(id: string) {
    const user = await UserModel.findOne({ id });
    if (!user) throw new E404(`User is not found`);

    if (user.statistics.dubber_team_member && user.statistics.dubber_team_member !== this.dubber.id) throw ERR_OTHER_TEAM_MEMBER;
    if (this.dubber.members.some(el => el.id === id)) throw ERR_MEMBER_ALREADY;
    if (!this.dubber.membersInvited.includes(id)) throw ERR_NOT_INVITED;

    this.dubber.membersInvited = this.dubber.membersInvited.filter(el => el !== id);
    this.dubber.members.push({
      id,
      memberSince: getUTC().timestamp,
      role: 'member',
    });

    // Send notification
    const userService = new UserService({ user });
    await userService.addSubscribe({ event: 'dubber_invite_accepted', key: this.dubber.id });
    await userService.save();

    await Notify.broadcast<INotifyDubberInvite>({
      event: 'dubber_invite_accepted',
      payload: {
        user_id: id,
        dubber_id: this.dubber.id
      }
    });

    await userService.patchStatistics({ dubber_team_member: this.dubber.id });
    await userService.addRole({ code: 'dubber_member' });
    await userService.removeSubscribe({ event: 'dubber_invite_accepted', key: this.dubber.id });
    await userService.removeSubscribe({ event: 'dubber_invite_pending', key: this.dubber.id });
    await userService.save();

    // TODO Add dubber team in user document

    this.stack.push(`User ${id} is now part of the team`);
    Logger.info(`User ${id} is now part of the ${this.dubber.id} dubber team`);

    this.dubber.markModified('members');
    this.dubber.markModified('members_invited');

    await this.save();
  }

  /** Change member data
   * Will save the document
   */
  async editMember({ id, role }: IMemberEdit) {
    const user = await UserModel.findOne({ id });
    if (!user) throw new E404(`User ${id} is not found to edit`);

    const member = this.dubber.members.find(el => el.id === id);
    if (!member) throw new E404(`Member ${id} is not found in this team`);

    const userService = new UserService({ user });

    if (role) {
      if (role !== 'editor' && role !== 'leader' && role !== 'member') throw new E400(`Role ${role} is invalid`);

      this.stack.push(`Member ${id} role changed (${member.role} > ${role})`);

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
      }

      member.role = role;
    }

    this.dubber.markModified('members');

    await userService.save();
    await this.dubber.save();
  }

  /** Remove member from team and invite. Will save the document */
  async removeMember(id: string, decline_invite?: boolean) {
    const user = await UserModel.findOne({ id });
    if (!user) throw new E404(`User ${id} is not found`);

    if (!this.dubber.members.some(el => el.id === id) && !this.dubber.membersInvited.includes(id)) throw ERR_NOT_MEMBER;
    if (decline_invite && !this.dubber.membersInvited.includes(id)) throw ERR_NOT_INVITED;


    const userService = new UserService({ user });
    if (decline_invite) {
      // Send notification about declined invite
      await userService.addSubscribe({ event: 'dubber_invite_declined', key: this.dubber.id });
      await userService.save();

      // Send notify
      await Notify.broadcast<INotifyDubberInvite>({
        event: 'dubber_invite_declined', payload: {
          user_id: id,
          dubber_id: this.dubber.id
        }
      });

      await userService.removeSubscribe({ event: 'dubber_invite_declined', key: this.dubber.id });
      await userService.removeSubscribe({ event: 'dubber_invite_pending', key: this.dubber.id });
    } else {
      // Send notification about excluding
      await userService.addSubscribe({ event: 'dubber_member_excluded', key: this.dubber.id });
      await userService.save();

      // Send notify
      await Notify.broadcast<INotifyDubberInvite>({
        event: 'dubber_member_excluded', payload: {
          user_id: id,
          dubber_id: this.dubber.id
        }
      });

      await userService.patchStatistics({ dubber_team_member: null });
      await userService.removeSubscribe({ event: 'dubber_member_excluded', key: this.dubber.id });
    }

    await userService.removeRole({ code: 'dubber_member' });
    await userService.removeRole({ code: 'dubber_editor' });
    await userService.removeRole({ code: 'dubber_leader' });
    await userService.save();


    // TODO Remove dubber team from user document

    this.stack.push(`Member ${id} removed`);
    Logger.info(`User ${id} excluded from the ${this.dubber.id} dubber team`);

    this.dubber.members = this.dubber.members.filter(el => el.id !== id);
    this.dubber.membersInvited = this.dubber.membersInvited.filter(el => el !== id);

    this.dubber.markModified('members');
    this.dubber.markModified('membersInvited');

    await this.save();
  }

  /** Invite member to the team. Will save the document */
  async inviteMember(id: string) {
    const user = await UserModel.findOne({ id });
    if (!user) throw new E404(`User ${id} is not found to invite`);

    if (!user.statistics.isTelegramLinked) throw ERR_TELEGRAM_MISS;
    if (user.statistics.dubber_team_member && user.statistics.dubber_team_member !== this.dubber.id) throw ERR_OTHER_TEAM_MEMBER;
    if (this.dubber.members.some(el => el.id === id)) throw ERR_MEMBER_ALREADY;
    if (this.dubber.membersInvited.includes(id)) throw ERR_INVITED_ALREADY;

    // Send invite notify
    const userService = new UserService({ user });
    await userService.addSubscribe({ event: 'dubber_invite_pending', key: this.dubber.id });
    await userService.save();

    await Notify.broadcast<INotifyDubberInvite>({
      event: 'dubber_invite_pending',
      payload: {
        user_id: id,
        dubber_id: this.dubber.id
      }
    });

    this.stack.push(`User ${id} invited`);
    Logger.info(`User ${id} invited in ${this.dubber.id} dubber team`);

    this.dubber.membersInvited.push(id);
    this.dubber.markModified('membersInvited');

    await this.save();
  }

  async patchStatistics({ createdAt }: TPatchStatistics) {
    if (createdAt) {
      this.stack.push(`Changed created_at (${this.dubber.statistics.createdAt} > ${createdAt})`);

      this.dubber.statistics.createdAt = createdAt;
      this.dubber.createdAt = createdAt;

      this.dubber.markModified('statistics');
    }
  }

  async patchSocialLink({ key, value }: IPatchSocialLink) {
    this.stack.push(`Social url for ${key} changed (${this.dubber.socials[key]} > ${value})`);

    this.dubber.socials[key] = value;
    this.dubber.markModified('socials');
  }

  async patchSupportLink({ key, value }: IPatchSupportlLink) {
    this.stack.push(`Support url for ${key} changed (${this.dubber.support[key]} > ${value})`);

    this.dubber.support[key] = value;
    this.dubber.markModified('support');
  }



  async uploadAvatar() {

  }

  async uploadBanner() {

  }
}

export default DubberModel;
import mongoose, { HydratedDocument, Schema } from 'mongoose';
import validator from 'validator';
import { convert as createSlug } from 'url-slug';

import { IDubber } from '../interfaces/Dubber';
import { createID, getNewUTC } from '../handlers/handler';
import { config, rules } from '../config';
import { E404, ERR_ALREADY_EXIST, ERR_INVALID_PAYLOAD, ERR_LENGTH_INVALID } from '../services/ErrorService';
import { Logger } from '../services/LoggerService';

/** To create/patch Dubber instance use DubberService */
export const DubberModel = mongoose.model<IDubber>('dubber', new Schema({
  id: String,
  code: String,
  name: String,
  thumbURL: String,
  socials: Object,
  support: Object,
  createdAt: Number,
  description: String,
  leader: String,
  editors: Array,
  members: Array,
  rating: Number,
  avatar: String,
  membersInvitePending: Array
}));

interface IDubberCreate {
  name: string
  code: string
}

/** Create/path Dubber instance */
export class DubberService {
  /** Crete new Dubber instance */
  async create({ name, code }: IDubberCreate): Promise<HydratedDocument<IDubber>> {
    code = createSlug(code);

    const nameValid = validator.isLength(name, {
      max: rules.CreateUser.maxNameLength,
      min: rules.CreateUser.minNameLength
    });
    if (!nameValid) throw new ERR_LENGTH_INVALID(`Name length is not valid`);

    const codeValid = validator.isLength(code, {
      max: rules.CreateUser.maxNameLength,
      min: rules.CreateUser.minNameLength
    });
    if (!codeValid) throw new ERR_LENGTH_INVALID(`Code length is not valid`);

    const existDubber = await DubberModel.findOne({ code });
    if (existDubber) throw new ERR_ALREADY_EXIST(`Dubber ${code} already exist`);

    const payload: IDubber = {
      id: createID(),
      name,
      code,
      avatar: config.vars.defaultAvatar,
      createdAt: getNewUTC().timestamp,
      description: null,
      editors: [],
      members: [],
      leader: null,
      membersInvitePending: [],
      rating: 9,
      thumbURL: config.vars.defaultAvatar,
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

    Logger.debug(`[DubberService]: New dubber ${name} created with id ${payload.id}`);

    return instance;
  }

  /** Path exist Dubber instance  */
  async patch(id: string, body: Partial<IDubber>) {
    const dubber = await DubberModel.findOne({ id });
    if (!dubber) throw new E404(`Dubber ${id} is not found`);

    const stack: string[] = [];

    for (const key in body) {
      const prop = key as keyof IDubber;
      const value = body[key];

      switch (prop) {
        case 'avatar': {
          if (!validator.isURL(value)) throw new ERR_INVALID_PAYLOAD(`Avatar URL is invalid`);

          stack.push(`Avatar URL changed (${dubber.avatar} > ${value})`);

          dubber.avatar = value;
          dubber.thumbURL = value;
        }
      }
    }

    await dubber.save();

    Logger.debug(`[DubberService]: Dubber ${id} patched. Changed - ${stack.length ? stack.join('; ') : 'Nothing patched...'}`);
  }
}

export default DubberModel;
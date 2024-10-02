import mongoose, { Schema } from 'mongoose';
import * as uuid from 'uuid';

import { IDubber } from '../interfaces/Dubber';
import { DeepPartial } from '../interfaces/Interfaces';
import { Logger } from '../services/LoggerService';
import { getNewUTC } from '../handlers/handler';

export const Dubber = mongoose.model<IDubber>('dubber', new Schema({
  id: String,
  code: String,
  name: String,
  thumbURL: String,
  socials: Object,
  support: Object,
  createdAt: Number,
  description: String || null,
  leader: String || null,
  editors: Array,
  members: Array,
  rating: Number,
  avatar: String,
  membersInvitePending: Array
}));

interface ICreateDubber extends Partial<IDubber> {
  code: string
  name: string
}

/** Create dubber instance */
export async function createDubber({
  code,
  name,
  createdAt,
  description,
  editors,
  id,
  leader,
  members,
  rating,
  socials,
  support,
  avatar
}: ICreateDubber) {
  const ID = id || uuid.v4();

  const payload: IDubber = {
    id: ID,
    code,
    name,
    createdAt: createdAt || getNewUTC().timestamp,
    description: description === undefined ? '' : description,
    editors: editors || [],
    leader: leader || null,
    members: members || [],
    rating: rating || 0,
    socials: socials || {
      instagram: null,
      telegram: null,
      tiktok: null,
      youtube: null
    },
    support: support || {
      bymeacoffee: null,
      diaka: null,
      monobank: null,
      patreon: null,
      privatbank: null
    },
    thumbURL: avatar || '',
    avatar: avatar || '',
    membersInvitePending: []
  };

  const dubber = new Dubber(payload);
  await dubber.save();

  Logger.debug(`[Dubber]: New dubber @${code}/${id} created`);

  return ID;
}

export default Dubber; 
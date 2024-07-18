import mongoose, { Schema } from 'mongoose';
import * as uuid from 'uuid';

import { IDubber } from '../interfaces/Dubber';
import { DeepPartial } from '../interfaces/Interfaces';
import { getUTC } from '../handlers/handlers';
import { writeLog } from '../handlers/Errors';

export const Dubbers = mongoose.model<IDubber>('dubber', new Schema({
  id: String,
  code: String,
  name: String,
  thumbURL: String,
  socials: Object,
  support: Object,
  createdAt: Number,
  description: String || null,
  leader: String || null,
  editors: Array || null,
  members: Array || null,
  rating: Number,
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
  thumbURL
}: ICreateDubber) {
  const ID = id || uuid.v4();

  const payload: IDubber = {
    code,
    name,
    createdAt: createdAt || getUTC().timestamp,
    description: description === undefined ? '' : description,
    editors: editors || [],
    id: ID,
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
    thumbURL: thumbURL || ''
  };

  const dubber = new Dubbers(payload);
  await dubber.save();

  writeLog('info', `New dubber ${id} created`, 'Dubber/createDubber');

  return ID;
}

export default Dubbers; 
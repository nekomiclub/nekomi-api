import mongoose, { Schema } from 'mongoose';
import { IDubber } from '~/core/interfaces/DubberIntf';

/** @private DO NOT USE IT ANYWHERE ELSE EXCEPT DUBBER SERVICE */
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
  banner: String,
}));

export default DubberModel;
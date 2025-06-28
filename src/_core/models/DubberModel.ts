import mongoose, { Schema } from 'mongoose';
import { Dubber } from '~/core/interfaces/Dubber.intf';



const schema = new Schema({
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
});

schema.set('optimisticConcurrency', false);

/** @private DO NOT USE IT ANYWHERE ELSE EXCEPT DUBBER SERVICE */
export const DubberModel = mongoose.model<Dubber>('dubber', schema);

export default DubberModel;
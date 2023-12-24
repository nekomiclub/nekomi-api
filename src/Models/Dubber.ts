import mongoose, { Schema } from 'mongoose';
import { IDubber } from '../core/interfaces';

export const Dubbers = mongoose.model<IDubber>('dubber', new Schema({
  id: String,
  code: String,
  name: String,
  thumbURL: String,
  socials: {
    telegram: String || null,
    instagram: String || null,
    youtube: String || null,
    tiktok: String || null
  },
  support: {
    diaka: String || null,
    monobank: String || null,
    privatbank: String || null,
    bymeacoffee: String || null,
    patreon: String || null
  },
  createdAt: Number,
  description: String || null,
  leader: String || null,
  editors: Array<string> || null,
  members: Array<string> || null,
  rating: Number,
}));

export default Dubbers; 
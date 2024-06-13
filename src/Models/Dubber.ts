import mongoose, { Schema } from 'mongoose';
import { IDubber } from '../interfaces/Dubber';

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

export default Dubbers; 
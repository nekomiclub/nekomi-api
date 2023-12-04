import mongoose, { Schema } from 'mongoose';
import { IDubber } from '../core/interfaces';

export const Dubbers = mongoose.model<IDubber>('dubber', new Schema({
  id: String,
  code: String,
  name: String,
  thumbURL: String
}));

export default Dubbers; 
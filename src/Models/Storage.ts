import mongoose, { Schema } from 'mongoose';
import { IStorageItem } from '../core/interfaces';

export const Storage = mongoose.model<IStorageItem>('storage_item', new Schema({
  id: String,
  dateAdded: Number,
  URI: String,
  URL: String,
}));

export default Storage; 
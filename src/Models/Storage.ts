import mongoose, { Schema } from 'mongoose';

export const Storage = mongoose.model('storage_item', new Schema({
  id: String,
  dateAdded: Number,
  URI: String,
}));

export default Storage; 
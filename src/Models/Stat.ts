import mongoose, { Schema } from 'mongoose';
import { IStat } from '../core/interfaces';
import { prodMode } from '../config';

export const Stats = mongoose.model<IStat>(prodMode ? 'stat' : 'dev_stat', new Schema({
  timestamp: Number,
  online: {
    min: Number,
    max: Number,
    avg: Number,
    total: Number
  },
  titles: Array,
  seriesUploaded: Number,
  titlesUpdated: Number
}));

export default Stats; 
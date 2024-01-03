import mongoose, { Schema } from 'mongoose';
import { IStat } from '../core/interfaces';

export const Stats = mongoose.model<IStat>('stat', new Schema({
  id: String,
  createdAccounts: Number,
  online: Array<{
    avg: number,
    peak: number,
    total: number,
  }>,
  popularDub: String,
  seriesUploaded: Number,
  titlesCreated: Number,
  titlesUpdated: Number,
  timestamp: Number,
  totalWatchtimeS: Number,
  titles: {
    popularTitle: String,
    popularDub: String,
    top30: Array<{
      id: string,
      watchtimeS: number,
      dubs: Array<{
        id: string,
        watchtimeS: number
      }>
    }>,
    total: Array<{
      id: string,
      watchtimeS: number,
      dubs: Array<{
        id: string,
        watchtimeS: number
      }>
    }>
  }
}));

export default Stats; 
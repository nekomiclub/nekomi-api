import mongoose, { Schema } from 'mongoose';
import { IAshdiVOD } from '~/core/interfaces/AshdiVOD.intf';



export const AshdiVODModel = mongoose.model<IAshdiVOD>('ashdi_vod', new Schema({
  createdAt: Number,
  imdbId: String,
  malIds: Array,
  nekomiIds: Array,
  seasons: Array,
  updatedAt: Number
}));

export default AshdiVODModel;
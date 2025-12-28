import mongoose, { Schema } from 'mongoose';
import { IAshdiVOD } from '~/intf/IAshdiVOD';



/** @deprecated */
export const AshdiVODModelOld = mongoose.model<IAshdiVOD>('ashdi_vods_olds', new Schema({
  createdAt: Number,
  imdbId: String,
  malIds: Array,
  seasons: Array,
  updatedAt: Number,
}));

export default AshdiVODModelOld;
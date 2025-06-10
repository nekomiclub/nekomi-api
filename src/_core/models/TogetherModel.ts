import TogetherRoom from '~/core/interfaces/Together';
import mongoose, { Schema } from 'mongoose';



/** @private DO NOT USE IT ANYWHERE ELSE EXCEPT TOGETHER SERVICE */
export const TogetherModel = mongoose.model<TogetherRoom>('together', new Schema({
  id: String,
  animeId: String,
  ownerId: String,
  slug: String
}));



export default TogetherModel;
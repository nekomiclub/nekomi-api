import IRole from '~/core/Interfaces/IRole';
import mongoose, { Schema } from 'mongoose';



export const RoleModel = mongoose.model<IRole>('role', new Schema({
  capabilities: Array,
  code: String,
  id: String,
  title: String
}));

export default RoleModel;
import IRole from '~/intf/IRole';
import mongoose, { Schema } from 'mongoose';



/** @deprecated rework into ABAC */
export const RoleModel = mongoose.model<IRole>('role', new Schema({
  capabilities: Array,
  code: String,
  id: String,
  title: String
}));

export default RoleModel;
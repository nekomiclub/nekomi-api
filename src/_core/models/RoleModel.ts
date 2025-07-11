import Role from '~/core/interfaces/Role.intf';
import mongoose, { Schema } from 'mongoose';



/** @private DO NOT USE IT ANYWHERE ELSE EXCEPT ROLE SERVICE */
export const RoleModel = mongoose.model<Role>('role', new Schema({
  capabilities: Array,
  code: String,
  id: String,
  title: String
}));

export default RoleModel;
import Role from '~/core/interfaces/Role.intf';
import mongoose, { Schema } from 'mongoose';



const schema = new Schema({
  capabilities: Array,
  code: String,
  id: String,
  title: String
});

schema.set('optimisticConcurrency', false);

/** @private DO NOT USE IT ANYWHERE ELSE EXCEPT ROLE SERVICE */
export const RoleModel = mongoose.model<Role>('role', schema);

export default RoleModel;
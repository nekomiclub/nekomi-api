import mongoose, { Schema } from 'mongoose';
import { IRole } from '../interfaces/Roles';

/** Roles mongodb model */
export const Role = mongoose.model<IRole>('role', new Schema({
  capabilities: Array,
  code: String,
  id: String,
  title: String
}));

/** Create new role object */
export async function createRole(payload: IRole) {
  const role = new Role(payload);

  await role.save();

  // TODO Write log about creation role
  console.log(`[Role]: New role created - ${payload.code} (${payload.id})`);
}

export default Role; 
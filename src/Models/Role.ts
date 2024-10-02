import mongoose, { Schema } from 'mongoose';
import { IRole } from '../interfaces/Roles';
import { Logger } from '../services/LoggerService';

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

  Logger.debug(`[Role]: New role created - ${payload.code}/${payload.id} with [${payload.capabilities.join(', ')}] capabilities`);
}

export default Role; 
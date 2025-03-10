import mongoose, { Schema } from 'mongoose';
import { IRole, TRoleCapability } from '~/core/interfaces/RoleIntf';
import { Logger } from '~/services/LoggerService';

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

/** Parse user roles and return capabilities */
export async function parseRoles(rolesArr: string[]): Promise<TRoleCapability[]> {
  const caps: TRoleCapability[] = [];

  const roles = await Role.find({
    code: {
      '$in': rolesArr
    }
  });

  roles.forEach(role => {
    role.capabilities.forEach(cap => {
      if (!caps.includes(cap)) caps.push(cap);
    });
  });

  return caps;
}

export default Role; 
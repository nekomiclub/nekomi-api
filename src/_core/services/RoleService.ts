import Role, { RoleCapability } from '~/core/interfaces/Role.intf';
import RoleModel from '~/core/models/RoleModel';
import { Logger } from '~/services/LoggerService';



/** Parse user roles and return capabilities */
export async function parseRoles(rolesArr: string[]): Promise<RoleCapability[]> {
  const caps: RoleCapability[] = [];

  const roles = await RoleModel.find({
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

/** Create new role object */
export async function createRole(payload: Role) {
  const role = new RoleModel(payload);

  await role.save();

  Logger.debug(`[Role]: New role created - ${payload.code}/${payload.id} with [${payload.capabilities.join(', ')}] capabilities`);
}


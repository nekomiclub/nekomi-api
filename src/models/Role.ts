import RoleModelNew from '~/core/models/RoleModel';
import { IRole, RoleCapability } from '~/core/interfaces/Role.intf';
import { Logger } from '~/services/LoggerService';



/** @deprecated use from /core */
export const RoleModel = RoleModelNew;
/** @deprecated use RoleModel instead */
export const Role = RoleModelNew;


/** Create new role object */
export async function createRole(payload: IRole) {
  const role = new Role(payload);

  await role.save();

  Logger.debug(`[Role]: New role created - ${payload.code}/${payload.id} with [${payload.capabilities.join(', ')}] capabilities`);
}

/** Parse user roles and return capabilities */
export async function parseRoles(rolesArr: string[]): Promise<RoleCapability[]> {
  const caps: RoleCapability[] = [];

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
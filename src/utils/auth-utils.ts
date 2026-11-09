import MiddlewareService from '~/services/MiddlewareService.js';
import SessionService from '~/services/SessionService.js';
import express from 'express';
import { NekoError } from '~/services/ExceptionService.js';
import { ROLE_PERMISSION_ENUM } from '~/domain/role.schema.js';
import { UserId, UserSessionId } from '~/interfaces/BrandedIds.js';
import { asUserSessionId } from '~/interfaces/BrandedIds.js';
import { getAPIKey, getAuthorizationToken } from './http-utils.js';
import { parseRolesPermissions } from '~/repositories/RoleRepository.js';



interface IGetSessionAuth {
  userId: UserId
  sessionId: UserSessionId
  permissions: ROLE_PERMISSION_ENUM[]
}



/**
 * Get current user & his permissions
 * Will use preprocessed data if request passed throught CheckAccess middleware
 * Will update session cookie
 */
export async function getSessionAuth(req: express.Request, res: express.Response): Promise<IGetSessionAuth> {
  if (req._nekomi.middlewaresPassed.includes('checkAccess') && req._nekomi.user) {
    return {
      userId: req._nekomi.user.id,
      sessionId: asUserSessionId(req._nekomi.user.sessionId),
      permissions: req._nekomi.user?.permissions ?? []
    };
  } else {
    const { user, sessionId } = await new SessionService().parse(getAuthorizationToken(req));

    const permissions = await parseRolesPermissions(user.roles);

    return {
      userId: user.id,
      sessionId,
      permissions,
    };
  }
}



/** 
 * Check is requester is an account owner
 * Will mutate provided state
 * 
 * @requires Session
 */
export async function isRequesterAccountOwner(req: express.Request, targetUserId: string, state?: boolean): Promise<boolean> {
  try {
    if (state) return state;

    const { user: currentUser } = await new MiddlewareService().checkAccess(getAuthorizationToken(req));

    state = currentUser.id === targetUserId;
    return state;
  } catch (e) {
    return false;
  }
}



/**
 * Check is requester is an administrator
 * Will mutate provided state
 * 
 * @requires Session
 */
export async function isRequesterAdmin(req: express.Request, state?: boolean): Promise<boolean> {
  if (state) return state;

  const { permissions } = await new MiddlewareService().checkAccess(getAuthorizationToken(req), [ROLE_PERMISSION_ENUM.enum.BASIC]);

  state = permissions?.includes(ROLE_PERMISSION_ENUM.enum.ABSOLUTE) ?? false;
  return state;
}



/**
 * Check is requester API Key is valid
 * Will mutate provided state
 * 
 * @requires API Key
 */
export async function isRequesterAPIValid(req: express.Request, state?: boolean): Promise<boolean> {
  if (state) return state;

  await new MiddlewareService().checkAPIKey(getAPIKey(req));

  state = true;
  return state;
}



/**
 * Is something is eligible
 * Otherwise throw an error is value is false
 */
export function isEligible(name: string, isEligible: boolean): boolean {
  if (!isEligible) throw new NekoError('sys:action_prevented', `You are not eligible for: ${name}`);

  return true;
}
import MiddlewareService from '~/service/MiddlewareService';
import SessionService from '~/service/SessionService';
import express from 'express';
import { NekoError } from '~/service/ExceptionService';
import { ROLE_PERMISSION } from '~/intf/IRole';
import { UserId, UserSessionId, asUserId, asUserSessionId } from '~/intf/IUser';
import { getCSRFToken, getSessionToken } from './http-utils';
import { parseRolesPermissions } from '~/repo/RoleRepository';



interface IGetSessionAuth {
  userId: UserId
  sessionId: UserSessionId
  permissions: ROLE_PERMISSION[]
}



/**
 * Get current user & his permissions
 * Will use preprocessed data if request passed throught CheckAccess middleware
 * Will update session cookie
 */
export async function getSessionAuth(req: express.Request, res: express.Response): Promise<IGetSessionAuth> {
  if (req._nekomi.middlewaresPassed.includes('checkAccess') && req._nekomi.user) {
    return {
      userId: asUserId(req._nekomi.user.id),
      sessionId: asUserSessionId(req._nekomi.user.sessionId),
      permissions: req._nekomi.user?.permissions ?? []
    };
  } else {
    const { user, sessionId } = await new SessionService().parse(getSessionToken(req));

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
  if (state) return state;

  const { user: currentUser } = await new MiddlewareService().checkAccess(getSessionToken(req));

  state = currentUser.id === targetUserId;
  return state;
}



/**
 * Check is requester is an administrator
 * Will mutate provided state
 * 
 * @requires Session
 */
export async function isRequesterAdmin(req: express.Request, state?: boolean): Promise<boolean> {
  if (state) return state;

  const { permissions } = await new MiddlewareService().checkAccess(getSessionToken(req), [ROLE_PERMISSION.BASIC]);

  state = permissions?.includes(ROLE_PERMISSION.ABSOLUTE) ?? false;
  return state;
}



/**
 * Check is requester csrf token is valid
 * Will mutate provided state
 * 
 * @requires CSRF
 */
export async function isRequesterCSRF(req: express.Request, origins?: string[], state?: boolean): Promise<boolean> {
  if (state) return state;

  await new MiddlewareService().checkCSRF(getCSRFToken(req), origins);

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
import MiddlewareService from '~/service/MiddlewareService';
import express from 'express';
import { NekoError } from '~/service/ExceptionService';
import { ROLE_PERMISSION } from '~/intf/IRole';
import { getCSRFToken, getSessionToken } from './http-utils';



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
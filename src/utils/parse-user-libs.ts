import express from 'express';

import IUser, { IUserLib } from '~/domain/user.schema.js';
import { isRequesterAccountOwner, isRequesterAdmin } from '~/utils/auth-utils.js';



/** @deprecated rework somehow */
async function parseUserLibs(req: express.Request, user: IUser): Promise<IUserLib[]> {
  let showPrivate = false;

  try {
    showPrivate = await isRequesterAdmin(req) || await isRequesterAccountOwner(req, user.id);
  } catch (e) { null; }

  return user.libs.filter(el => {
    if (el.is_public) return el;
    if (!el.is_public && showPrivate) return el;

    return undefined;
  });
}

export default parseUserLibs;
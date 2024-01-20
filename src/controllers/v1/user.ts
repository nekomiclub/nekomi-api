import express from 'express';
import { ErrorConstructor, E400, E401, E403, E404, writeErrorLog } from '../../handlers/v1/Errors';
import { randomNumber } from '../../handlers/v1/handlers';
import fs from 'fs';
import * as dto from '../../handlers/v1/dtos';
import * as handler from '../../handlers/v1/handlers';
import * as authService from '../../services/v1/auth';
import User from '../../Models/User';
import { validationResult } from 'express-validator';
import { devMode } from '../../config';
import { dayStat } from '../../services/v1/stats';
import ip from 'ip';

export async function get(req: express.Request, res: express.Response) {
  try {
    const { query } = req.params as { query: string };

    const item = await User.findOne({ $or: [{ uid: query }, { username: query }] });

    if (!item) {
      throw new E400('User with provided query is not found.');
    }

    return res.status(200).json(dto.user(item));
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}

export async function update(req: express.Request, res: express.Response) {
  try {
    const { uid } = req.body as { uid: string };

    const item = await User.findOne({ uid });
    const tokenData = authService.decode(req.header('Authorization')!.split('=')[1])!;

    if (!item) {
      throw new E400('User with provided ID is not found.');
    }

    if (tokenData.uid !== uid && !tokenData.roles.includes('root' || 'admin' || 'moderator')) {
      throw new E403('You can not change not yours data');
    }

    for (const i in req.body) {
      if (i === 'id') return;
      item[i] = req.body[i];
    }

    await item.save();

    return res.status(200).json({ uid });
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}

export async function create(req: express.Request, res: express.Response) {
  try {
    const valRes = validationResult(req);

    if (!valRes.isEmpty()) {
      return res.status(400).json(valRes.array());
    }

    const { password, username, email } = req.body as { username: string, password: string, email: string };
    const isExist = await User.findOne({ $or: [{ username }, { email }] });

    if (isExist) {
      throw new E400('User is already exist');
    }

    // Update created accounts day stat
    dayStat.createdAccounts++;

    const uid = await authService.createUser(username, password);
    const tokens = await authService.auth(username, password);

    // todo auth
    return res.status(200).cookie('refreshToken', tokens.refreshToken, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30, domain: devMode ? ip.address() : '.animee.club' }).json({ msg: 'Created', uid, token: tokens.accessToken });
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}

export async function remove(req: express.Request, res: express.Response) {
  try {
    const valRes = validationResult(req);

    if (!valRes.isEmpty()) {
      return res.status(400).json(valRes.array());
    }

    const { uid } = req.body;
    const tokenData = authService.decode(req.header('Authorization')!.split('=')[1])!;
    const user = await User.findOne({ uid });

    if (!user) {
      throw new E400('User with provided ID is not found');
    }

    if (tokenData.uid !== uid && !tokenData.roles.includes('root' || 'admin' || 'moderator')) {
      throw new E403('You can not change not yours data');
    }

    await User.findOneAndDelete({ uid });

    return res.status(200).json(`UID: ${uid} deleted`);
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}

export async function auth(req: express.Request, res: express.Response) {
  try {
    const valRes = validationResult(req);

    if (!valRes.isEmpty()) {
      return res.status(400).json(valRes.array());
    }

    const { password, username, token } = req.body as { username: string, password: string, token?: string };

    const tokens = await authService.auth(username, password, token);

    return res.status(200).cookie('refreshToken', tokens.refreshToken, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30, domain: devMode ? ip.address() : '.animee.club' }).json({ token: tokens.accessToken });
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}

export async function refresh(req: express.Request, res: express.Response) {
  try {
    const valRes = validationResult(req);

    if (!valRes.isEmpty()) {
      return res.status(400).json(valRes.array());
    }

    const { refreshToken } = req.cookies as { refreshToken: string };

    const isValid = authService.verify(refreshToken, 'refresh');

    if (!isValid) {
      throw new E401('Refresh token is invalid. Re-login');
    }

    const { roles, uid, username } = authService.decode(refreshToken)!;
    const tokens = authService.signTokens({ uid, roles, username });

    return res.status(200).cookie('refreshToken', tokens.refreshToken, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30, domain: devMode ? ip.address() : '.animee.club' }).json({ token: tokens.accessToken });
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}

export async function logout(req: express.Request, res: express.Response) {
  try {
    return res.status(200).clearCookie('refreshToken').json('ok');
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}
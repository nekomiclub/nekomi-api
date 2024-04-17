import express from 'express';
import { ErrorConstructor, E400, E401, E403, E404, writeErrorLog, catchError } from '../handlers/v1/Errors';
import { randomNumber } from '../handlers/v1/handlers';
import fs from 'fs';
import * as dto from '../handlers/v1/dtos';
import * as handler from '../handlers/v1/handlers';
import * as authService from '../services/v1/auth';
import User from '../Models/User';
import { validationResult } from 'express-validator';
import { config, devMode, testMode } from '../config';
import ip from 'ip';
import * as tokenService from '../services/v1/auth';
import axios from 'axios';
import Title from '../Models/Title';



export async function postSignin(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    const { session } = req.body as { session: string };
    let id = '';

    try {
      if (testMode) {
        id = session;
      } else {
        const sessionData = await axios.post<{ msg: string, id: string }>(`${config.microservices.usapi}/auth/refresh`, {
          session
        });

        id = sessionData.data.id;
      }
    } catch (e) {
      throw new E400('Session token invalid');
    }

    const user = await User.findOne({ id });

    if (!user) {
      // TODO Create new user
      throw new E404('User with ID provided by token is not found');
    }

    return res.status(200).cookie(config.vars.sessionCookieName, session, { httpOnly: true, maxAge: 60000 * 60 * 24 * 31 }).json({ msg: 'ok' });
  });
}

export async function getLogout(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    return res.status(205).clearCookie(config.vars.sessionCookieName).json({ msg: 'ok' });
  });
}

export async function getQuery(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    const { query } = req.params as { query: string };

    const user = await User.findOne({ $or: [{ id: query }, { uid: query }, { username: query }] });

    if (!user) {
      throw new E400(`User ${query} is not found.`);
    }

    return res.status(200).json(dto.user(user.toObject()));
  });
}

export async function update(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
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
  });
}

export async function create(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    const { password, username, email } = req.body as { username: string, password: string, email: string };
    const isExist = await User.findOne({ $or: [{ username }, { email }] });

    if (isExist) {
      throw new E400('User is already exist');
    }

    const uid = await authService.createUser(username, password);
    const tokens = await authService.auth(username, password);

    // todo auth
    return res.status(200).cookie('oldRefreshToken', tokens.refreshToken, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30, domain: devMode ? ip.address() : '.animee.club' }).json({ msg: 'Created', uid, token: tokens.accessToken });
  });
}

export async function remove(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
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
  });
}
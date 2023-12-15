import express from 'express';
import { ErrorConstructor, E400, E401, E403, E404, writeErrorLog } from '../../handlers/v1/Errors';
import { randomNumber } from '../../handlers/v1/handlers';
import fs from 'fs';
import * as dto from '../../handlers/v1/dtos';
import * as authService from '../../services/v1/auth';
import User from '../../Models/User';
import { validationResult } from 'express-validator';
import { IUser } from '../../core/interfaces';
import * as uuid from 'uuid';
import bcrypt from 'bcrypt';
import { defaultAvatars, testMode } from '../../config';

export async function get(req: express.Request, res: express.Response) {
  try {
    const valRes = validationResult(req);

    if (!valRes.isEmpty()) {
      return res.status(400).json(valRes.array());
    }

    const { uid } = req.params as { uid: string };

    const item = await User.findOne({ uid });

    if (!item) {
      throw new E400('User with provided ID is not found.');
    }

    return res.status(200).json(dto.user(item));
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
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
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
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

    const { password, username } = req.body as { username: string, password: string };
    const isExist = await User.findOne({ username });

    if (isExist) {
      throw new E400('User is already exist');
    }

    const uid = testMode ? `testid-${uuid.v4()}` : uuid.v4();

    const user: IUser = {
      uid,
      username,
      password: bcrypt.hashSync(password, 7),
      settings: {},
      stats: {
        createdAt: +new Date(),
        titles: {
          delayed: 0,
          favorites: 0,
          plans: 0,
          threwn: 0,
          watched: 0
        },
        player: {
          totalWatched: 0,
          popularDub: null,
          watchedTitles: null
        },
      },
      providers: ['animee'],
      avatar: defaultAvatars[randomNumber(0, defaultAvatars.length - 1)],
      profileBg: null,
      badgesIDs: null,
      lists: [{
        createdAt: +new Date(),
        description: 'Тайтли, які запали в саме серце',
        hidden: true,
        immortal: true,
        thumb: '',
        titles: [],
        name: 'Улюблені',
        id: `favorite-${uid}`
      }, {
        createdAt: +new Date(),
        description: 'Ти вже в цій тємі',
        hidden: true,
        immortal: true,
        thumb: '',
        titles: [],
        name: 'Переглянуті',
        id: `watched-${uid}`
      }, {
        createdAt: +new Date(),
        description: 'Колись вони будуть переглянуті',
        hidden: true,
        immortal: true,
        thumb: '',
        titles: [],
        name: 'В планах',
        id: `plans-${uid}`
      }, {
        createdAt: +new Date(),
        description: 'Хто зна коли їх перегляд буде закінчений',
        hidden: true,
        immortal: true,
        thumb: '',
        titles: [],
        name: 'Відкладені',
        id: `delayed-${uid}`
      }, {
        createdAt: +new Date(),
        description: 'Побачив, пошкодував, закинув',
        hidden: true,
        immortal: true,
        thumb: '',
        titles: [],
        name: 'Закинуті',
        id: `threwn-${uid}`
      }],
      roles: ['user']
    };

    const item = new User(user);
    await item.save();

    return res.status(200).json({ msg: 'CREATED. Now login', uid });
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
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
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
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

    const { password, username } = req.body as { username: string, password: string };

    const user = await User.findOne({ username });

    if (!user) {
      throw new E400('User with provided username is not found');
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new E400('Password is incorrect');
    }

    const tokens = authService.signTokens({ uid: user.uid, username, roles: user.roles });

    return res.status(200).cookie('refreshToken', tokens.refreshToken, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30 }).json({ token: tokens.accessToken });
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
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

    return res.status(200).cookie('refreshToken', tokens.refreshToken, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30 }).json({ token: tokens.accessToken });
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
      return res.status(500).json(e);
    }
  }
}
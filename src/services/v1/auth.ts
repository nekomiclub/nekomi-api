import jwt from 'jsonwebtoken';
import { config, userDefaultRoles } from '../../config';
import { TUserRoles } from '../../core/IUser';
import * as handler from '../../handlers/v1/handlers';
import { testMode, devMode, defaultAvatars } from '../../config';
import { IUser } from '../../core/interfaces';
import * as uuid from 'uuid';
import bcrypt from 'bcrypt';
import User from '../../Models/User';
import { E400, E403 } from '../../handlers/v1/Errors';
import firebaseAdmin from 'firebase-admin';
import { TAuthProviders } from '../../core/IAuth';
import axios from 'axios';

interface ITokenPayload {
  username: string,
  roles: TUserRoles[],
  uid: string
}

export function signTokens(payload: ITokenPayload): { accessToken: string, refreshToken: string } {
  return {
    accessToken: jwt.sign(payload, config.secrets.jwtAccess, { expiresIn: '15m' }),
    refreshToken: jwt.sign(payload, config.secrets.jwtRefresh, { expiresIn: '30d' })
  };
}

export function verify(token: string, method: 'access' | 'refresh'): boolean {
  try {
    jwt.verify(token, method === 'access' ? config.secrets.jwtAccess : config.secrets.jwtRefresh);
    return true;
  } catch (e) {
    return false;
  }
}

export function decode(token: string): ITokenPayload | null {
  const decoded = jwt.decode(token) as ITokenPayload | null;

  if (!decoded) {
    return null;
  }

  return { uid: decoded.uid, roles: decoded.roles, username: decoded.username };
}

export async function createUser(username: string, password: string, providers?: TAuthProviders[]): Promise<string> {
  const uid = testMode ? `testid-${uuid.v4()}` : uuid.v4();

  const user: IUser = {
    uid,
    username,
    email: 'example@example.com',
    password: bcrypt.hashSync(password, 7),
    settings: {},
    stats: {
      createdAt: handler.getUTCTime(),
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
    providers: providers || ['animee'],
    avatar: defaultAvatars[handler.randomNumber(0, defaultAvatars.length - 1)],
    profileBg: null,
    badgesIDs: null,
    lists: [{
      createdAt: handler.getUTCTime(),
      description: 'Тайтли, які запали в саме серце',
      hidden: true,
      immortal: true,
      thumb: '',
      titles: [],
      name: 'Улюблені',
      id: `favorite-${uid}`
    }, {
      createdAt: handler.getUTCTime(),
      description: 'Ти вже в цій тємі',
      hidden: true,
      immortal: true,
      thumb: '',
      titles: [],
      name: 'Переглянуті',
      id: `watched-${uid}`
    }, {
      createdAt: handler.getUTCTime(),
      description: 'Колись вони будуть переглянуті',
      hidden: true,
      immortal: true,
      thumb: '',
      titles: [],
      name: 'В планах',
      id: `plans-${uid}`
    }, {
      createdAt: handler.getUTCTime(),
      description: 'Хто зна коли їх перегляд буде закінчений',
      hidden: true,
      immortal: true,
      thumb: '',
      titles: [],
      name: 'Відкладені',
      id: `delayed-${uid}`
    }, {
      createdAt: handler.getUTCTime(),
      description: 'Ого, так багато?',
      hidden: true,
      immortal: true,
      thumb: '',
      titles: [],
      name: 'Переглядаю',
      id: `watching-${uid}`
    }],
    roles: userDefaultRoles,
    accountType: 'new'
  };

  const item = new User(user);
  await item.save();

  return uid;
}

export async function auth(username: string, password: string, token?: string): Promise<{ accessToken: string, refreshToken: string }> {
  const user = await User.findOne({ username });

  if (password.match(/^~/gi)) {
    if (!token) {
      throw new E400('Auth provider does not provided access token');
    }

    if (password.match(/~google/gi)) {
      const data = await firebaseAdmin.auth().verifyIdToken(token)!.catch(e => { throw new E400('Token privided by google is not valid'); });

      if (!user) {
        throw new E400('Account registration via google is disabled due to new account api');
      } else {
        if (data.email!.split('@')[0] !== username) {
          throw new E400('Username provided by token is not equal to provided');
        }

        if (!user.providers.includes('google')) {
          throw new E400('User does not have google provider');
        }
      }
    } else if (password.match(/~usapi/gi)) {
      const tokenRes = await axios.post(`${config.microservices.usapi}/token/decode`, {
        token,
        method: 'access'
      });

      const tokenPayload = tokenRes.data as { payload: { id: string, username: string, photoURL: string }, info: any, msg: string, verified: boolean };

      if (!tokenPayload.verified) {
        throw new E400('Usapi token is invalid');
      }

      if (!user) {
        const uid = await createUser(username, `~usapi_${+new Date() + (Math.random() * 100)}`, ['fullkekw']);
        return signTokens({ uid, username, roles: userDefaultRoles });
      } else {
        if (user.accountType === 'new' && user.uid !== tokenPayload.payload.id) {
          throw new E400('Token is invalid for that user');
        }

        if (user.accountType === 'old' && user.username !== tokenPayload.payload.username) {
          throw new E400('Token is invalid for that user');
        }

        if (user.accountType !== 'new') {
          user.uid = tokenPayload.payload.id;
          user.accountType = 'new';
          user.avatar = tokenPayload.payload.photoURL;

          await user.save();
        }
      }
    }
  } else {
    if (!user) {
      throw new E400('User with provided username is not found');
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new E400('Password is incorrect');
    }
  }

  return signTokens({ uid: user!.uid, username, roles: user!.roles });
}
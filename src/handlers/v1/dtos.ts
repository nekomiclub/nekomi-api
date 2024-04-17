import { IDubber, ITitle } from '../../core/interfaces';
import { IUser } from '../../interfaces/User';

interface IMongodbDocument {
  __v: number,
  _id: any,
  [key: string]: any
}

// Replace private info with blanks
function hideKeys(excludeKeys: string[], obj: object) {
  for (const key in obj) {
    const val = obj[key];

    if (excludeKeys.includes(key)) {
      if (Array.isArray(val)) {
        obj[key] = [];
      } else if (typeof val === 'object') {
        obj[key] = {};
      } else if (typeof val === 'number') {
        obj[key] = 0;
      } else if (typeof val === 'string') {
        // Tests may fall if not equal "Hidden for privacy purposes"
        obj[key] = 'Hidden for privacy purposes';
      } else if (typeof val === 'boolean') {
        obj[key] = false;
      }
    }
  }
}

export function title(raw: any): ITitle {
  const { __v, _id, ...title } = raw._doc;
  return title;
}

export function dubber(raw: any): IDubber {
  const { __v, _id, ...dubber } = raw._doc;
  return dubber;
}

/** Return IUser excluding private info. Raw must be passed as Model.toObject() */
export function user(raw: IMongodbDocument): IUser {
  const { __v, _id, ...payload } = raw;
  const user = payload as IUser;

  const excludeKeys: (keyof IUser)[] = [
    'roles',
    'accountType',
    'password',
    'settings',
    'providers'
  ];
  hideKeys(excludeKeys, user);

  return user;
}
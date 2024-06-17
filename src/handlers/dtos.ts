import { IDubber } from '../interfaces/Dubber';
import { ITitle } from '../interfaces/Title';
import { IUser } from '../interfaces/User';

interface IMongodbDocument {
  __v: number,
  _id: any,
  [key: string]: any
}

/** Hide sensetive values in object. Will MUTATE input object
 * @param excludeKeys An array of excluded keys (use next type (keyof INTERFACE)[])
 * 
 * @example
 * [42, 'foo'] -> []
 * {foo: 42} -> {}
 * 42 -> 0
 * "hello" -> "Hidden for privacy purposes"
 * true -> false
 */
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

/** Title DTO */
export function title(raw: IMongodbDocument): ITitle {
  const { __v, _id, ...payload } = raw;
  const title = payload as ITitle;

  const excludeKeys: (keyof ITitle)[] = [];
  hideKeys(excludeKeys, user);

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

  const excludeKeys: (keyof IUser)[] = [];
  hideKeys(excludeKeys, user);

  return user;
}
import { IDubber } from '../interfaces/Dubber';
import { ITitle } from '../interfaces/Title';
import { IUser } from '../interfaces/User';

interface IMongodbDocument {
  __v: number,
  _id: any,
  [key: string]: any
}

/** Hide sensitive values in object. Will MUTATE input object
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

/** Title DTO. Raw must be passed as Model.toObject() */
export function title(raw: IMongodbDocument): ITitle {
  const { __v, _id, ...payload } = raw;
  const title = payload as ITitle;

  const excludeKeys: (keyof ITitle)[] = [];
  hideKeys(excludeKeys, user);

  return title;
}

export function dubber(raw: IMongodbDocument): IDubber {
  const { __v, _id, ...dubber } = raw._doc;
  return dubber;
}

/** User DTO. Raw must be passed as Model.toObject()
 * @param privateMode In private mode sensitive information will be hidden
 */
export function user(raw: IMongodbDocument, privateMode?: boolean): IUser {
  const { __v, _id, ...payload } = raw;
  const user = payload as IUser;

  const excludeKeys: (keyof IUser)[] = privateMode ? [
    'roles',
    'statistics',
    'libs'
  ] : [];

  hideKeys(excludeKeys, user);

  return user;
}
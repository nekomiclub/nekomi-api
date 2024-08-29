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
    if (excludeKeys.includes(key)) {
      obj[key] = undefined;
    }
  }
}

/** Title DTO. Raw must be passed as Model.toObject()
 * @param privateMode In private mode episodes & their meta will be hidden. Default - true
 */
export function title(raw: IMongodbDocument, privateMode?: boolean): ITitle {
  const { __v, _id, ...payload } = raw;
  const title = payload as ITitle;

  privateMode = privateMode === undefined ? true : privateMode;

  const excludeKeys: (keyof ITitle)[] = privateMode ? [
    'episodes',
    'episodesMeta'
  ] : [];

  hideKeys(excludeKeys, title);

  return title;
}

export function dubber(raw: IMongodbDocument): IDubber {
  const { __v, _id, ...payload } = raw;
  const dubber = payload as IDubber;

  return dubber;
}

/** User DTO. Raw must be passed as Model.toObject()
 * @param privateMode In private mode sensitive information will be hidden. Default - true
 */
export function user(raw: IMongodbDocument, privateMode?: boolean): IUser {
  const { __v, _id, ...payload } = raw;
  const user = payload as IUser;

  privateMode = privateMode === undefined ? true : privateMode;

  const excludeKeys: (keyof IUser)[] = privateMode ? [
    'roles',
    'statistics',
    'libs',
    'watchProgress',
    'telegramLinkToken'
  ] : [];

  const alwaysExcludedKeys: (keyof IUser)[] = ['subscribes', 'telegramData'];

  hideKeys([...excludeKeys, ...alwaysExcludedKeys], user);

  return user;
}
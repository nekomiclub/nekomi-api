import { IUser, IDubber, ITitle } from '../../core/interfaces';

export function title(raw: any): ITitle {
  const { __v, _id, ...title } = raw._doc;
  return title;
}

export function dubber(raw: any): IDubber {
  const { __v, _id, ...dubber } = raw._doc;
  return dubber;
}

export function user(raw: any): IUser {
  const { __v, _id, password, email, ...user } = raw._doc;
  return user;
}
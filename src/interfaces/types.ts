import { JwtPayload } from 'jsonwebtoken';
import { QueryFilter } from 'mongoose';



/** ISO Date string */
export type ISODateString = string;

/** Nekomi CDN string */
export type CDNString = string;

export type RepositoryGetQueryType<M> = string | QueryFilter<keyof M>
export type RepositoryQueriesType<M> = { $or: Partial<Record<keyof M, string>>[] }

export interface IJWTokenPayload<T = object> {
  payload: JwtPayload & T;

  /** Will be null if verify method is not specified */
  verified: boolean | null;
}

export interface IHomeFeedHero {
  id: string;

  // TODO: Will be available when document will be fetched from DB
  // slug: string;
  // title: string;
  // about: string;

  cover: CDNString;
  video: CDNString | null;
}

// eslint-disable-next-line
export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;
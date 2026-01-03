import z from 'zod';
import { Filter } from 'mongodb';
import { JwtPayload } from 'jsonwebtoken';



/** ISO Date string */
export type ISODateString = string;

/** Nekomi CDN string */
export type CDNString = string;

export type RepositoryGetQueryType<M> = string | Filter<M>
export type RepositoryQueriesType<M> = { $or: Partial<Record<keyof M, string>>[] }

export type NestedKey<T> = {
  [K in keyof T]:
  T[K] extends object
  ? K | `${K & string}.${keyof T[K] & string}`
  : K
}[keyof T]

export type ValueFromPath<T, P> =
  P extends `${infer K}.${infer R}`
  ? K extends keyof T
  ? R extends keyof T[K]
  ? T[K][R]
  : never
  : never
  : P extends keyof T
  ? T[P]
  : never

export interface IJWTokenPayload<T = object> {
  payload: JwtPayload & T;

  /** Will be null if verify method is not specified */
  verified: boolean | null;
}

// eslint-disable-next-line
export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;





export interface IHomeFeedHero {
  id: string
  slug: string
  title: string
  synopsys: string | null

  poster: CDNString
  cover: CDNString
  video: CDNString | null
}

export const zBoolean = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());
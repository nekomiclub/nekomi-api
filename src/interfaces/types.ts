import { JwtPayload } from 'jsonwebtoken';
import { QueryFilter } from 'mongoose';



/** ISO Date string */
export type ISODateString = string;

/** Nekomi CDN string */
export type CDNString = string;

export type RepositoryGetQueryType<M> = string | QueryFilter<keyof M>
export type RepositoryQueriesType<M> = { $or: Partial<Record<keyof M, string>>[] }

export interface ICSRFToken {
  origin: string
}

export interface IJWTokenPayload<T = object> {
  payload: JwtPayload & T;

  /** Will be null if verify method is not specified */
  verified: boolean | null;
}
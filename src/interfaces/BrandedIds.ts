export declare const __brand: unique symbol;
export type BrandedId<T, B extends string> = T & { [__brand]: B };

export function asBrandedId<T>(val: string) {
  return val as T;
}



export type ISODateString = string
export type CDNString = string



export type AnimeId = string

export type UserId = string
export type UserLibId = string
export type UserSessionId = string

export type TeamId = string

export type RoleId = string



// ====================================================



export const asISODateString = asBrandedId<ISODateString>;
export const asCDNString = asBrandedId<CDNString>;



export const asAnimeId = asBrandedId<AnimeId>;

export const asUserId = asBrandedId<UserId>;
export const asUserLibId = asBrandedId<UserLibId>;
export const asUserSessionId = asBrandedId<UserSessionId>;

export const asTeamId = asBrandedId<TeamId>;

export const asRoleId = asBrandedId<RoleId>;
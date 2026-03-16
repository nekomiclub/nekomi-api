declare const __brand: unique symbol;
export type BrandedId<T, B extends string> = T & { [__brand]: B; };

export function asBrandedId<T>(val: string) {
  return val as T;
}



export type ISODateString = BrandedId<string, 'ISODateString'>;
export type CDNString = BrandedId<string, 'CDNString'>;



export type AnimeId = BrandedId<string, 'animeId'>;

export type UserId = BrandedId<string, 'userId'>;
export type UserLibId = BrandedId<string, 'userLibId'>;
export type UserSessionId = BrandedId<string, 'userSessionId'>;

export type TeamId = BrandedId<string, 'teamId'>;

export type RoleId = BrandedId<string, 'roleId'>;



// ====================================================



export const asISODateString = asBrandedId<ISODateString>;
export const asCDNString = asBrandedId<CDNString>;



export const asAnimeId = asBrandedId<AnimeId>;

export const asUserId = asBrandedId<UserId>;
export const asUserLibId = asBrandedId<UserLibId>;
export const asUserSessionId = asBrandedId<UserSessionId>;

export const asTeamId = asBrandedId<TeamId>;

export const asRoleId = asBrandedId<RoleId>;
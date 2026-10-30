import z from 'zod';
import { asAnimeId, asCDNString, asISODateString, asUserId, asUserLibId, asUserSessionId } from '~/intf/BrandedIds';



/* --------------------- */
/* Native enum           */
/* --------------------- */

export enum USER_RESTRICTION {
  BANNED = 'user:banned',
  UPLOAD_AVATAR = 'user:upload_avatar',
  UPLOAD_COVER = 'user:upload_cover',
  USERNAME_CHANGE = 'user:username_change',
}

export enum USER_LIB_TYPE {
  FAVORITE = 'favorite',
  WATCHING = 'watching',
  WATCHED = 'watched',
  DELAYED = 'delayed',
  PLANS = 'plans',
}

/* --------------------- */
/* Schema                */
/* --------------------- */

export const UserSessionSchema = z.object({
  id: z.string().transform(asUserSessionId),

  is_limited: z.boolean(),

  expires_at: z.string().transform(asISODateString),
  created_at: z.string().transform(asISODateString),
});

export const UserLibSchema = z.object({
  id: z.string().transform(asUserLibId),
  type: z.nativeEnum(USER_LIB_TYPE),

  anime_ids: z.string().transform(asAnimeId).array(),

  is_public: z.boolean(),
  created_at: z.string().transform(asISODateString),
});

export const UserViewProgressSchema = z.object({
  anime_id: z.string(),
  dubber_id: z.string(),

  episode: z.number(),
  progress: z.number(), // seconds

  updated_at: z.string().transform(asISODateString),
});

export const UserSchema = z.object({
  id: z.string().transform(asUserId),
  username: z.string(),
  email: z.string().email(),

  avatar: z.string().transform(asCDNString),
  cover: z.string().transform(asCDNString),

  roles: z.string().array(),
  libs: UserLibSchema.array(),
  restrictions: z.nativeEnum(USER_RESTRICTION).array(),
  sessions: UserSessionSchema.array(),
  subscriptions: z.string().array(),

  total_viewtime: z.number(),
  view_progress: UserViewProgressSchema.array(),
  telegram_id: z.number().nullable(),
  dubber_team_member: z.string().nullable(),

  username_changed_at: z.string().transform(asISODateString),
  created_at: z.string().transform(asISODateString),
  updated_at: z.string().transform(asISODateString),
});

/* --------------------- */
/* DTS                   */
/* --------------------- */

export const UserMinifiedSchema = UserSchema.pick({
  id: true,
  username: true,
  avatar: true,
  cover: true,
});

/* --------------------- */
/* Inferred type         */
/* --------------------- */

export type IUserSession = z.infer<typeof UserSessionSchema>

export type IUserLib = z.infer<typeof UserLibSchema>

export type IUserViewProgress = z.infer<typeof UserViewProgressSchema>

export type IUser = z.infer<typeof UserSchema>

export type IUserMinified = z.infer<typeof UserMinifiedSchema>

/** @deprecated pending rework */
export type UserCardType = Pick<IUser, 'id' | 'username' | 'avatar' | 'cover'>



export default IUser;
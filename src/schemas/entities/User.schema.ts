import z from 'zod';



/* --------------------- */
/* Native enum           */
/* --------------------- */

export enum USER_RESTRICTION_ENUM {
  BANNED = 'user:banned',
  UPLOAD_AVATAR = 'user:upload_avatar',
  UPLOAD_COVER = 'user:upload_cover',
  USERNAME_CHANGE = 'user:username_change',
}

export enum USER_LIB_TYPE_ENUM {
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
  id: z.string(),

  is_limited: z.boolean(),

  expires_at: z.string(),
  created_at: z.string(),
});

export const UserLibSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(USER_LIB_TYPE_ENUM).openapi('USER_LIB_TYPE_ENUM'),

  anime_ids: z.string().array(),

  is_public: z.boolean(),
  created_at: z.string(),
}).openapi('UserLib');

export const UserViewProgressSchema = z.object({
  anime_id: z.string(),
  dubber_id: z.string(),

  episode: z.number(),
  progress: z.number(), // seconds

  updated_at: z.string(),
}).openapi('UserViewProgress');

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),

  avatar: z.string(),
  cover: z.string(),

  roles: z.string().array(),
  libs: UserLibSchema.array(),
  restrictions: z.nativeEnum(USER_RESTRICTION_ENUM).openapi('USER_RESTRICTION_ENUM').array(),
  sessions: UserSessionSchema.array(),
  subscriptions: z.string().array(),

  total_viewtime: z.number(),
  view_progress: UserViewProgressSchema.array(),
  telegram_id: z.number().nullable(),
  dubber_team_member: z.string().nullable(),

  username_changed_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

/* --------------------- */
/* DTS                   */
/* --------------------- */

export const UserPublicSchema = UserSchema.pick({
  id: true,
  username: true,

  avatar: true,
  cover: true,

  dubber_team_member: true,

  username_changed_at: true,
  created_at: true,
  updated_at: true,
}).openapi('User');

export const UserMinifiedSchema = UserSchema.pick({
  id: true,
  username: true,
  avatar: true,
  cover: true,
}).openapi('UserMinified');

export const UserSearchResultSchema = UserMinifiedSchema.openapi('UserSearchResult');

/* --------------------- */
/* Inferred type         */
/* --------------------- */

export type IUserSession = z.infer<typeof UserSessionSchema>

export type IUserLib = z.infer<typeof UserLibSchema>

export type IUserViewProgress = z.infer<typeof UserViewProgressSchema>

export type IUser = z.infer<typeof UserSchema>
export type IUserPublic = z.infer<typeof UserPublicSchema>
export type IUserMinified = z.infer<typeof UserMinifiedSchema>
export type IUserSearchResult = z.infer<typeof UserSearchResultSchema>



export default IUser;
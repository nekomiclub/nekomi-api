import User from '~/core/interfaces/User.intf';
import { HydratedAnime } from '~/core/interfaces/Anime.intf';
import { RoleCapability } from '~/core/interfaces/Role.intf';
import { ZodBooleanish } from '~/core/interfaces/types';
import { z } from 'zod';



export interface UserGetSearchProps {
  /** Query ~all will return all users */
  q: string

  /** Parse user invitation data (can/not be invited, already member) for dubber id */
  parseInvitationStatusFor?: string
}

export interface UserGetSearch {
  user: User

  /** @requires parseInvitationStatusFor */
  invitationStatus?: 'can_be_invited' | 'telegram_not_linked' | 'invite_pending' | 'others_member_already'
}

export interface UserGetLibProps {
  query: string
  libId: string
}

export interface UserGetLib {
  results: HydratedAnime[]
}

export interface UserGetTogetherRoomProps {
  query: string
  roomId: string
}

export interface UserGetTogetherRoom {
  room: void
  anime: HydratedAnime
}

export interface PutBanner {
  bannerUrl: string
}



export interface UserGetByQueryProps {
  query: string

  parseCapabilities?: boolean
  parseLibId?: string
  detailed?: boolean
}



export interface UserGetByQuery {
  user: User

  capabilities?: RoleCapability[]
  parsedLib?: HydratedAnime[]
}

export const UserGetByQuerySchema = {
  params: z.object({
    query: z.string(),
  }),

  search: z.object({
    /** Detailed mode. Require specified CSRF token */
    detailed: ZodBooleanish.optional(),

    /** Parse user capabilities from roles */
    parseCapabilities: ZodBooleanish.optional(),

    /** Parse lib anime documents. Require session provided for hidden libs */
    parseLibId: z.string().optional(),
  })
};

export type UserGetByQueryParamsType = z.infer<typeof UserGetByQuerySchema.params>
export type UserGetByQuerySearchType = z.infer<typeof UserGetByQuerySchema.search>



export const UserPatchSchema = z.object({
  editFolderAnime: z.object({
    libId: z.string(),
    animeId: z.string(),
  }).optional(),

  watchProgress: z.object({
    animeId: z.string(),
    dubberId: z.string(),
    episodeOrder: z.number(),

    /** Session viewtime in seconds */
    viewtime: z.number(),

    /** View progress in seconds */
    progress: z.number()
  }).optional(),

  removeWatchProgress: z.object({
    animeId: z.string(),
  }).optional()
});

export type UserPatchProps = z.infer<typeof UserPatchSchema>
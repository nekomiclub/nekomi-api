import User, { UserTogetherRoom } from '~/core/interfaces/User.intf';
import { DubberCompact } from '~/core/interfaces/Dubber.intf';
import { HydratedAnime } from '~/core/interfaces/Anime.intf';
import { Metadata } from '~/core/interfaces/types';
import { TRoleCapability } from '~/core/interfaces/Role.intf';
import { UserPatchWatchProgressProps } from '~/core/services/UserService';

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

export interface UserGetByQueryProps {
  query: string

  /** Return only metadata */
  metadataOnly?: boolean
  parseCapabilities?: boolean
  parseLibId?: string
  parseTogetherRoomId?: string
  detailed?: boolean
}

export interface UserGetByQuery {
  /** Will be undefined with metadataOnly specified */
  user: User

  capabilities?: TRoleCapability[]
  metadata?: Metadata
  parsedLib?: HydratedAnime[]
  parsedTogetherRoom?: {
    anime: HydratedAnime
    dubbers: DubberCompact[]
  }
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
  room: UserTogetherRoom
  anime: HydratedAnime
}

export interface UserPatchProps {
  id: string

  watchProgress?: UserPatchWatchProgressProps

  /** Anime ID */
  deleteWatchProgress?: string
}
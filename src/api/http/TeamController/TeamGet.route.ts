import DTOService from '~/service/DataTransferService';
import ITeam, { TeamCardType, TeamRoleType } from '~/intf/ITeam';
import UserRepository from '~/repo/UserRepository';
import conf from '~/conf';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';
import { ISODateString, zBoolean } from '~/intf/types';
import { TeamRepositoryClass } from '~/repo/TeamRepository';
import { UserCardType } from '~/intf/IUser';
import { isEligible, isRequesterCSRF } from '~/utils/auth-utils';



const FullResponseKeys = ['id', 'slug', 'name', 'about', 'avatar', 'cover', 'socials', 'support'] as const;
type FullResponseType = Pick<ITeam, typeof FullResponseKeys[number]>

interface IDubberMemberResponse extends UserCardType {
  role: TeamRoleType
  member_since: ISODateString
}



interface IResponseMisc {
  /** @method get_members */
  members?: IDubberMemberResponse[]



  /** @method get_timestamps */
  created_at?: ISODateString

  /** @method get_timestamps */
  updated_at?: ISODateString
}

interface IResponse {
  message: string

  dubber: IResponseMisc & (FullResponseType | TeamCardType | object)
}



const ParamSchema = z.object({
  query: z.string().nonempty()
});

const QuerySchema = z.object({
  view: z.enum(['full', 'card', 'empty']).default('card'),
  get_timestamps: zBoolean.optional(),

  /** @requires Authorization (CSRF) */
  get_members: zBoolean.optional(),
});



/**
 * Get dubber document
 */
const endpoint = HandleRequest(async (req, res) => {
  const { query } = ParamSchema.parse(req.params);
  const { get_members, get_timestamps, view } = QuerySchema.parse(req.query);

  const repo = new TeamRepositoryClass();
  await repo.init(query);

  const dubber = repo.document;

  let dubber_full: FullResponseType | undefined;
  let dubber_card: TeamCardType | undefined;
  let dubber_misc: IResponseMisc = {};



  if (view === 'card') dubber_card = DTOService.toTeamCard(dubber);
  else if (view === 'full') dubber_full = DTOService.includeKeys(dubber, [...FullResponseKeys]);

  if (get_members) {
    if (isEligible('get_members', await isRequesterCSRF(req, [conf.domains.NEKOMI_DOMAIN]))) {
      const users = await UserRepository.getMany({ id: { $in: dubber.members.map(el => el.id) } });

      dubber_misc.members = users.map(user => {
        const { id, avatar, username, cover } = DTOService.toUserCard(user);
        const { member_since, role } = dubber.members.find(el => el.id === user.id)!;

        const member: IDubberMemberResponse = {
          id,
          avatar,
          username,
          cover,
          role,
          member_since,
        };

        return member;
      });
    }
  }

  if (get_timestamps) {
    dubber_misc.created_at = dubber.created_at;
    dubber_misc.updated_at = dubber.updated_at;
  }



  return res.status(200).json({
    message: 'Dubber retrieved',
    dubber: {
      ...dubber_full,
      ...dubber_card,
      ...dubber_misc
    }
  } satisfies IResponse);
});



const DubberGetRoute = [
  endpoint
];

export default DubberGetRoute;
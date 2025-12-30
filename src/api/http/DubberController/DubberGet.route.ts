import DTOService from '~/service/DataTransferService';
import IDubber, { DubberCardType, DubberRoleType } from '~/intf/IDubber';
import UserRepository from '~/repo/UserRepository';
import conf from '~/config';
import z from 'zod';
import { DubberRepositoryClass } from '~/repo/DubberRepository';
import { HandleRequest } from '~/utils/http-utils';
import { ISODateString, zBoolean } from '~/intf/types';
import { UserCardType } from '~/intf/IUser';
import { isEligible, isRequesterCSRF } from '~/utils/auth-utils';



type PublicDubberKeys = keyof Pick<IDubber, 'id'
  | 'slug'
  | 'name'
  | 'about'
  | 'avatar'
  | 'cover'
  | 'socials'
  | 'support'>

type ProtectedDubberKeys = keyof Pick<IDubber, 'created_at'
  | 'updated_at'>

type DubberFullType = Pick<IDubber, PublicDubberKeys>

type DubberMiscType = Partial<Pick<IDubber, ProtectedDubberKeys>>

interface IDubberMemberResponse extends UserCardType {
  role: DubberRoleType
  member_since: ISODateString
}

interface IResponse {
  message: string

  dubber_full: DubberFullType | undefined
  dubber_card: DubberCardType | undefined
  dubber_misc: DubberMiscType | undefined

  members: IDubberMemberResponse[] | undefined
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

  const repo = new DubberRepositoryClass();
  await repo.init(query);

  const dubber = repo.document;

  let dubber_full: DubberFullType | undefined;
  let dubber_card: DubberCardType | undefined;
  let dubber_misc: DubberMiscType = {};
  let members: IDubberMemberResponse[] | undefined;



  if (view === 'card') dubber_card = DTOService.toDubberCard(dubber);
  else if (view === 'full') {
    dubber_full = {
      id: dubber.id,
      slug: dubber.slug,
      name: dubber.name,
      about: dubber.about,
      avatar: dubber.avatar,
      cover: dubber.cover,
      socials: dubber.socials,
      support: dubber.support,
    };
  }

  if (get_members) {
    if (isEligible('get_members', await isRequesterCSRF(req, [conf.domains.NEKOMI_DOMAIN]))) {
      const users = await UserRepository.getMany({ id: { $in: dubber.members.map(el => el.id) } });

      members = users.map(user => {
        const { id, avatar, username } = DTOService.toUserCard(user);
        const { member_since, role } = dubber.members.find(el => el.id === user.id)!;

        const member: IDubberMemberResponse = {
          id,
          avatar,
          username,
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
    dubber_full,
    dubber_card,
    dubber_misc: Object.keys(dubber_misc).length ? dubber_misc : undefined,
    members,
  } satisfies IResponse);
});



const DubberGetRoute = [
  endpoint
];

export default DubberGetRoute;
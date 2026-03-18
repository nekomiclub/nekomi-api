import CacheService from '~/service/CacheService';
import DTS from '~/service/DataTransferService';
import UserRepository from '~/repo/UserRepository';
import ms from 'ms';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';
import { ITeamMinified, TeamMinifiedSchema, TeamRoleSchema, TeamSchema } from '~/schemas/entities/Team.schema';
import { TeamRepositoryClass } from '~/repo/TeamRepository';
import { UserMinifiedSchema } from '~/schemas/entities/User.schema';
import { asISODateString } from '~/intf/BrandedIds';
import { zBoolean } from '~/intf/types';



const TeamPublicMemberSchema = UserMinifiedSchema.extend({
  role: TeamRoleSchema,
  member_since: z.string().transform(asISODateString)
});

const TeamPublicSchema = TeamSchema.omit({
  members: true
}).extend({
  members: TeamPublicMemberSchema.array()
});

type ITeamPublic = z.infer<typeof TeamPublicSchema>



const ParamSchema = z.object({
  query: z.string().nonempty()
});

const QuerySchema = z.object({
  is_extended: zBoolean.optional()
});

const ResponseSchema = z.object({
  message: z.string(),
  team: TeamPublicSchema.or(TeamMinifiedSchema)
});



const TeamCache = new CacheService('TeamCache', { ttl: ms('3hours') });



/**
 * Get dubber document
 */
const endpoint = HandleRequest(async (req, res) => {
  const { query } = ParamSchema.parse(req.params);
  const { is_extended } = QuerySchema.parse(req.query);

  const repo = new TeamRepositoryClass();
  await repo.init(query);

  let team: ITeamPublic | ITeamMinified;

  if (is_extended) {
    const refinedTeam = TeamSchema.parse(repo.document);
    const users = await UserRepository.getMany({ id: { $in: repo.document.members.map(el => el.id) } });

    refinedTeam.members = users.map(user => {
      const refinedUser = DTS.toUserMinified(user);
      const { member_since, role } = repo.document.members.find(el => el.id === user.id)!;

      const memberExtendede = TeamPublicMemberSchema.parse({
        ...refinedUser,
        role,
        member_since,
      });

      return memberExtendede;
    });

    team = refinedTeam;
  } else team = DTS.refine(repo.document, TeamMinifiedSchema);



  return res.status(200).json({
    message: 'Dubber retrieved',
    team
  } satisfies z.infer<typeof ResponseSchema>);
});



export default [
  endpoint
];
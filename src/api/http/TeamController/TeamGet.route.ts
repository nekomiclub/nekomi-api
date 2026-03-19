import DTS from '~/service/DataTransferService';
import UserRepository from '~/repo/UserRepository';
import conf from '~/conf';
import z from 'zod';
import { ArgumentTypes, zBoolean } from '~/intf/types';
import { HandleRequest } from '~/utils/http-utils';
import { TeamMinifiedSchema, TeamRoleSchema, TeamSchema } from '~/schemas/entities/Team.schema';
import { TeamRepositoryClass } from '~/repo/TeamRepository';
import { UserMinifiedSchema } from '~/schemas/entities/User.schema';
import { asISODateString } from '~/intf/BrandedIds';
import { isEligible, isRequesterCSRF } from '~/utils/auth-utils';



const TeamPublicMemberSchema = UserMinifiedSchema.extend({
  role: TeamRoleSchema,
  member_since: z.string().transform(asISODateString)
});

const TeamPublicSchema = TeamSchema.omit({
  members: true
}).extend({
  members: TeamPublicMemberSchema.array()
});



const ParamSchema = z.object({
  query: z.string().nonempty()
});

const QuerySchema = z.object({
  /**
   * Get extended team object
   * 
   * @requires Authorization (CSRF)
   */
  is_extended: zBoolean.optional()
});

const ResponseSchema = z.object({
  message: z.string(),
  team: TeamPublicSchema.or(TeamMinifiedSchema)
});



/**
 * Get dubber document
 */
const endpoint = HandleRequest(async (req, res) => {
  const { query } = ParamSchema.parse(req.params);
  const { is_extended } = QuerySchema.parse(req.query);

  const repo = new TeamRepositoryClass();
  await repo.init(query);

  let isCSRFValid = false;

  const isCSRF = async (...args: ArgumentTypes<typeof isRequesterCSRF>) => { return isCSRFValid = await isRequesterCSRF(...args); };

  let team: z.infer<typeof ResponseSchema.shape.team>;



  if (is_extended && isEligible(`is_extended`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
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
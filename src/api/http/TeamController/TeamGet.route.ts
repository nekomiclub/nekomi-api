import DTS from '~/service/DataTransferService';
import UserRepository from '~/repo/UserRepository';
import conf from '~/conf';
import z from 'zod';
import { ArgumentTypes, zBoolean } from '~/intf/types';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils';
import { TeamMinifiedSchema, TeamRoleSchema, TeamSchema } from '~/schemas/entities/Team.schema';
import { TeamRepositoryClass } from '~/repo/TeamRepository';
import { UserMinifiedSchema } from '~/schemas/entities/User.schema';
import { asISODateString } from '~/intf/BrandedIds';
import { isEligible, isRequesterCSRF } from '~/utils/auth-utils';
import { registry } from '~/service/openapi/registry';



const TeamExtendedMemberSchema = UserMinifiedSchema.extend({
  role: TeamRoleSchema,
  member_since: z.string().transform(asISODateString)
});

export const GetTeamExtendedSchema = TeamSchema.omit({
  members: true
}).extend({
  members: TeamExtendedMemberSchema.array()
});

const TeamDataSchema = z.object({
  team: GetTeamExtendedSchema.or(TeamMinifiedSchema)
});



const RequestParamsSchema = z.object({
  query: z.string().nonempty().describe('(slug, id, etc)')
});

const RequestQuerySchema = z.object({
  is_extended: zBoolean.optional().describe('Get extended team object. @requires Authorization (CSRF)')
});

const ResponseSchema = CreateResponseSchema(TeamDataSchema);



registry.registerPath({
  method: 'get',
  path: '/team/{query}',
  summary: 'Get team by query',
  tags: ['Team Router'],
  request: {
    params: RequestParamsSchema
  },
  responses: {
    200: {
      description: 'Team retrieved',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



/**
 * Get team document
 */
const endpoint = HandleRequest(async (req, res) => {
  const { query } = RequestParamsSchema.parse(req.params);
  const { is_extended } = RequestQuerySchema.parse(req.query);

  const repo = new TeamRepositoryClass();
  await repo.init(query);

  let isCSRFValid = false;

  const isCSRF = async (...args: ArgumentTypes<typeof isRequesterCSRF>) => { return isCSRFValid = await isRequesterCSRF(...args); };

  let team: z.infer<typeof TeamDataSchema.shape.team>;



  if (is_extended && isEligible(`is_extended`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
    const refinedTeam = TeamSchema.parse(repo.document);
    const users = await UserRepository.getMany({ id: { $in: repo.document.members.map(el => el.id) } });

    refinedTeam.members = users.map(user => {
      const refinedUser = DTS.toUserMinified(user);
      const { member_since, role } = repo.document.members.find(el => el.id === user.id)!;

      const memberExtendede = TeamExtendedMemberSchema.parse({
        ...refinedUser,
        role,
        member_since,
      });

      return memberExtendede;
    });

    team = refinedTeam;
  } else team = DTS.refine(repo.document, TeamMinifiedSchema);



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'Team retrieved',
    data: {
      team
    }
  }, ResponseSchema));
});



export default EndpointMiddlewares([], endpoint);



export const TeamGetRouteSchemas = {
  RequestParamsSchema,
  RequestQuerySchema,
  ResponseSchema,
};
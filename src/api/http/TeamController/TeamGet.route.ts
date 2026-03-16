import CacheService from '~/service/CacheService';
import DTOService from '~/service/DataTransferService';
import ms from 'ms';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';
import { TeamMinifiedSchema } from '~/intf/ITeam';
import { TeamRepositoryClass } from '~/repo/TeamRepository';
import { UserMinifiedSchema } from '~/intf/IUser';
import { asCDNString, asISODateString, asTeamId } from '~/intf/BrandedIds';
import { zBoolean } from '~/intf/types';



export const TeamRoleSchema = z.enum([
  'leader',
  'editor',
  'member',
  'pending',
]);

export const TeamMemberSchema = UserMinifiedSchema.extend({
  role: TeamRoleSchema,
  member_since: z.string().refine(asISODateString),
});

export const TeamSchema = z.object({
  id: z.string().refine(asTeamId),
  slug: z.string(),
  name: z.string(),
  about: z.string().nullable(),

  avatar: z.string().refine(asCDNString),
  cover: z.string().refine(asCDNString),

  socials: z.object({
    telegram: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    tiktok: z.string().optional(),
  }).optional(),

  support: z.object({
    diaka: z.string().optional(),
    monobank: z.string().optional(),
    privatbank: z.string().optional(),
    bymeacoffee: z.string().optional(),
    patreon: z.string().optional(),
  }).optional(),

  members: z.array(TeamMemberSchema),

  created_at: z.string().refine(asCDNString),
  updated_at: z.string().refine(asCDNString),
});



const ParamSchema = z.object({
  query: z.string().nonempty()
});

const QuerySchema = z.object({
  is_extended: zBoolean.optional()
});

const TeamGetResponseSchema = z.object({
  message: z.string(),
  team: TeamSchema.or(TeamMinifiedSchema)
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

  let team: z.infer<typeof TeamSchema> | z.infer<typeof TeamMinifiedSchema>;

  if (is_extended) {
    const refined = DTOService.refine(repo.document, TeamSchema);
    // const users = await UserRepository.getMany({ id: { $in: repo.document.members.map(el => el.id) } });

    // refined.members = users.map(user => {
    //   const refined = DTOService.refine(user, UserMinifiedSchema);
    //   const { member_since, role } = repo.document.members.find(el => el.id === user.id)!;

    //   const member = TeamMemberSchema.parse({
    //     ...refined,
    //     role,
    //     member_since,
    //   });

    //   return member;
    // });

    team = refined;
  } else team = DTOService.refine(repo.document, TeamMinifiedSchema);



  return res.status(200).json({
    message: 'Dubber retrieved',
    team
  } satisfies z.infer<typeof TeamGetResponseSchema>);
});



export default [
  endpoint
];
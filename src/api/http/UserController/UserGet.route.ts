import MiddlewareService from '~/service/MiddlewareService';
import conf from '~/config';
import z from 'zod';
import { ArgumentTypes, CDNString, ISODateString, zBoolean } from '~/intf/types';
import { HandleRequest, getSessionToken } from '~/utils/http-utils';
import { IUserViewProgress, USER_RESTRICTION } from '~/intf/IUser';
import { ROLE_PERMISSION } from '~/intf/IRole';
import { UserRepositoryClass } from '~/repo/UserRepository';
import { isEligible, isRequesterAccountOwner, isRequesterAdmin, isRequesterCSRF } from '~/utils/auth-utils';
import { parseRolesPermissions } from '~/repo/RoleRepository';



interface IResponse {
  message: string
  user: {
    id: string
    username: string
    avatar: CDNString
    cover: CDNString
    total_viewtime: number
    dubber_team_member: string | null
    roles: string[]

    /** @method get_email */
    email: string | undefined

    /** @method get_username_changed_at */
    username_changed_at?: ISODateString
  }

  /** @method get_permissions */
  permissions: ROLE_PERMISSION[] | undefined

  /** @method get_restrictions */
  restrictions: USER_RESTRICTION[] | undefined

  /** @method get_view_progress */
  view_progress: IUserViewProgress[] | undefined
}



const ParamsSchema = z.object({
  query: z.string().nonempty().optional()
});

const QuerySchema = z.object({
  get_permissions: zBoolean.optional(),
  get_username_changed_at: zBoolean.optional(),

  /** @requires Authorization (CSRF) */
  get_view_progress: zBoolean.optional(),

  /** @requires Authorization (CSRF) */
  get_email: zBoolean.optional(),

  /** @requires Authorization (CSRF+Session) only for owner & admin */
  get_restrictions: zBoolean.optional(),
});



/**
 * Get user by query or by session
 * If query is not provided, will try to parse userId from session
 * 
 * @see QuerySchema
 */
const endpoint = HandleRequest(async (req, res) => {
  const { query } = ParamsSchema.parse(req.params);
  const { get_permissions, get_restrictions, get_username_changed_at, get_view_progress, get_email } = QuerySchema.parse(req.query);

  const repo = new UserRepositoryClass();

  let email: string | undefined;
  let username_changed_at: ISODateString | undefined;
  let permissions: ROLE_PERMISSION[] | undefined;
  let restrictions: USER_RESTRICTION[] | undefined;
  let view_progress: IUserViewProgress[] | undefined;

  let isUserOwner = false;
  let isUserAdmin = false;
  let isCSRFValid = false;

  const isAdmin = async (...args: ArgumentTypes<typeof isRequesterAdmin>) => { return isUserAdmin = await isRequesterAdmin(...args); };
  const isOwner = async (...args: ArgumentTypes<typeof isRequesterAccountOwner>) => { return isUserOwner = await isRequesterAccountOwner(...args); };
  const isCSRF = async (...args: ArgumentTypes<typeof isRequesterCSRF>) => { return isCSRFValid = await isRequesterCSRF(...args); };



  // Get query from session
  if (!query) {
    const { user } = await new MiddlewareService().checkAccess(getSessionToken(req));

    await repo.init({ id: user.id });
  } else await repo.init(query);

  const user = repo.document!;



  if (get_permissions) permissions = await parseRolesPermissions(user.roles);
  if (get_username_changed_at) username_changed_at = user.username_changed_at;

  if (get_restrictions) {
    if (isEligible(`get_restrictions`, (await isAdmin(req, isUserAdmin) || await isOwner(req, user.id, isUserOwner)) && await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
      restrictions = user.restrictions;
    }
  }

  if (get_email) {
    if (isEligible(`get_email`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
      email = user.email;
    }
  }

  if (get_view_progress) {
    if (isEligible(`get_view_progress`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
      view_progress = user.view_progress;
    }
  }



  return res.status(200).json({
    message: 'User retrieved',
    user: {
      id: user.id,
      avatar: user.avatar,
      cover: user.cover,
      username: user.username,
      total_viewtime: user.total_viewtime,
      dubber_team_member: user.dubber_team_member,
      roles: user.roles,

      email,
      username_changed_at,
    },
    permissions,
    restrictions,
    view_progress
  } satisfies IResponse);
});



const UserGetRoute = [
  endpoint
];

export default UserGetRoute;
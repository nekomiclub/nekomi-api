import DTOService from '~/service/DataTransferService';
import IUser, { IUserLib, IUserViewProgress, USER_RESTRICTION, UserCardType } from '~/intf/IUser';
import MiddlewareService from '~/service/MiddlewareService';
import conf from '~/conf';
import z from 'zod';
import { ArgumentTypes, ISODateString, zBoolean } from '~/intf/types';
import { HandleRequest, getSessionToken } from '~/utils/http-utils';
import { ROLE_PERMISSION } from '~/intf/IRole';
import { UserRepositoryClass } from '~/repo/UserRepository';
import { isEligible, isRequesterAccountOwner, isRequesterAdmin, isRequesterCSRF } from '~/utils/auth-utils';
import { parseRolesPermissions } from '~/repo/RoleRepository';



const FullResponseKeys = ['id', 'username', 'avatar', 'cover', 'total_viewtime', 'dubber_team_member', 'roles'] as const;
type FullResponseType = Pick<IUser, typeof FullResponseKeys[number]>



interface IResponseMisc {
  /** @method get_email */
  email?: string



  /** @method get_username_changed_at */
  username_changed_at?: ISODateString



  /** @method get_permissions */
  permissions?: ROLE_PERMISSION[]



  /** @method get_restrictions */
  restrictions?: USER_RESTRICTION[]



  /** @method get_view_progress */
  view_progress?: IUserViewProgress[]



  /** @method get_libs */
  libs?: IUserLib[]



  /** @method get_timestamps */
  created_at?: ISODateString

  /** @method get_timestamps */
  updated_at?: ISODateString
}

interface IResponse {
  message: string
  user: IResponseMisc & (FullResponseType | UserCardType | object)
}



const ParamsSchema = z.object({
  query: z.string().nonempty().optional(),
});

const QuerySchema = z.object({
  view: z.enum(['full', 'card', 'empty']).default('card'),

  get_permissions: zBoolean.optional(),
  get_username_changed_at: zBoolean.optional(),
  get_timestamps: zBoolean.optional(),

  /** @requires Authorization (CSRF) */
  get_view_progress: zBoolean.optional(),

  /** @requires Authorization (CSRF) */
  get_email: zBoolean.optional(),

  /** @requires Authorization (CSRF+Session) only for owner & admin */
  get_restrictions: zBoolean.optional(),

  /** @requires Authorization (CSRF+Session) only for owner & admin */
  get_libs: zBoolean.optional(),
});



/**
 * Get user by query or by session
 * If query is not provided, will try to parse userId from session
 * 
 * @see QuerySchema
 */
const endpoint = HandleRequest(async (req, res) => {
  const { query } = ParamsSchema.parse(req.params);
  const { get_permissions, get_restrictions, get_username_changed_at, get_view_progress, get_email, get_libs, view, get_timestamps } = QuerySchema.parse(req.query);

  const repo = new UserRepositoryClass();
  const user_misc: IResponseMisc = {};

  let user_full: FullResponseType | undefined;
  let user_card: UserCardType | undefined;

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

  const user = repo.document;



  if (view === 'card') user_card = DTOService.toUserCard(user);
  else if (view === 'full') user_full = DTOService.includeKeys(user, [...FullResponseKeys]);

  if (get_permissions) user_misc.permissions = await parseRolesPermissions(user.roles);
  if (get_username_changed_at) user_misc.username_changed_at = user.username_changed_at;

  if (get_timestamps) {
    user_misc.created_at = user.created_at;
    user_misc.updated_at = user.updated_at;
  }

  if (get_restrictions) {
    if (isEligible(`get_restrictions`, (await isAdmin(req, isUserAdmin) || await isOwner(req, user.id, isUserOwner)) && await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
      user_misc.restrictions = user.restrictions;
    }
  }

  if (get_libs) {
    if (isEligible(`get_libs`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
      user_misc.libs = user.libs;
    }
  }

  if (get_email) {
    if (isEligible(`get_email`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
      user_misc.email = user.email;
    }
  }

  if (get_view_progress) {
    if (isEligible(`get_view_progress`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
      user_misc.view_progress = user.view_progress;
    }
  }



  return res.status(200).json({
    message: 'User retrieved',
    user: {
      ...user_full,
      ...user_card,
      ...user_misc,
    },
  } satisfies IResponse);
});



const UserGetRoute = [
  endpoint
];

export default UserGetRoute;
import DubberController, { IDubberGetOneProps, IDubberPostInviteSADProps } from './controller';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { ERR_MIDDLEWARE_REQUIRED, ERR_TYPE_INVALID } from '~/services/ErrorService';
import { HTTPEndpoint } from '~/services/HTTPService';
import { MiddlewareService } from '~/services/MiddlewareService';
import { body, param } from 'express-validator';
import { config } from '~/config';



//* ===================================== GET BY ID
const getOne = HTTPEndpoint(async (req, res) => {
  const { query } = req.params as Partial<IDubberGetOneProps>;
  let { detailed } = req.query as Partial<IDubberGetOneProps>;
  const CSRFToken = req.header(config.vars.csrfHeader);

  if (typeof query !== 'string') throw new ERR_TYPE_INVALID();

  // Ensure that only client get detailed document
  if (detailed !== undefined && CSRFToken !== undefined) {
    const middleware = new MiddlewareService();
    await middleware.checkCSRF(CSRFToken, [config.DOMAIN.nekomi]);

    detailed = true;
  }

  const { dubber, message, status } = await DubberController.GetOne({ query, detailed });

  return res.status(status).json({ message, dubber });
});

const GetOne = [
  getOne,
];


//* ===================================== PATCH SETTINGS
const patchSettings = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED('checkCSRF');
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED('checkAccess');

  const { status, message, dubber } = await DubberController.PatchSettings(req.body);

  return res.status(status).json({ message, dubber });
});

const PatchSettings = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['dubberEditProfile', 'admin']),
  body('id').notEmpty(),
  patchSettings
];



//* ===================================== GET INVITE BY ID
const getInviteById = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED('checkAccess');

  const { id: dubberId } = req.params as { id: string };
  const { id: userId } = req.nekomi.user!;

  if (typeof dubberId !== 'string') throw new ERR_TYPE_INVALID();

  const { message, status } = await DubberController.GetInviteById({ dubberId, userId });

  return res.status(status).json({ message });
});

const GetInviteById = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  param('id').notEmpty(),
  getInviteById,
];



//* ===================================== POST INVITE SEND
const postInviteSend = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED('checkCSRF');
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED('checkAccess');

  const { userId, dubberId } = req.body as IDubberPostInviteSADProps;

  if (typeof userId !== 'string' || typeof dubberId !== 'string') throw new ERR_TYPE_INVALID();

  const { message, status } = await DubberController.PostInviteSend({ dubberId, userId });

  return res.status(status).json({ message });
});

const PostInviteSend = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['dubberEditMembers', 'admin']),
  body(['userId', 'dubberId']).notEmpty(),
  postInviteSend,
];



//* ===================================== POST INVITE ACCEPT
/** UserId will be taken from session, this prop can be passed */
const postInviteAccept = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED('checkCSRF');
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED('checkAccess');

  const { dubberId } = req.body as IDubberPostInviteSADProps;
  const { id: userId } = req.nekomi.user!;

  const { message, status } = await DubberController.PostInviteAccept({ dubberId, userId });

  return res.status(status).json({ message });
});

const PostInviteAccept = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  body('dubberId').notEmpty(),
  postInviteAccept,
];


//* ===================================== POST INVITE DECLINE
/** UserId will be taken from session, this prop can be passed */
const postInviteDecline = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED('checkCSRF');
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED('checkAccess');

  const { dubberId } = req.body as IDubberPostInviteSADProps;
  const { id: userId } = req.nekomi.user!;

  const { message, status } = await DubberController.PostInviteDecline({ dubberId, userId });

  return res.status(status).json({ message });
});

const PostInviteDecline = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  body('dubberId').notEmpty(),
  postInviteDecline,
];



export default class DubberRoutes {
  static GetOne = GetOne;
  static PatchSettings = PatchSettings;
  static GetInviteById = GetInviteById;
  static PostInviteSend = PostInviteSend;
  static PostInviteDecline = PostInviteDecline;
  static PostInviteAccept = PostInviteAccept;
}
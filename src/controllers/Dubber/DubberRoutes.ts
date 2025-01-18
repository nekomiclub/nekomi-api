import DubberController, { IDubberDeleteMemberByIdProps, IDubberGetOneByQueryProps, IDubberGetSearch, IDubberPatchMemberByIdProps, IDubberPatchSettingsProps, IDubberPostInviteSADProps, IDubberPutAvatarProps, IDubberPutBannerProps } from './DubberController';
import multer from 'multer';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { ERR_INVALID_PAYLOAD, ERR_MIDDLEWARE_REQUIRED, ERR_TYPE_INVALID } from '~/Services/ErrorService';
import { HTTPEndpoint } from '~/Services/HTTPService';
import { MiddlewareService } from '~/Services/MiddlewareService';
import { body, param, query } from 'express-validator';
import { config } from '~/config';
import { parseObjectTypes } from '~/handlers/handler';



/** Proxy file uploading */
const upload = multer();



//* ===================================== GET BY ID
const getOne = HTTPEndpoint(async (req, res) => {
  const { query } = parseObjectTypes<IDubberGetOneByQueryProps>(req.params);
  let { detailed, fetchDubbedAnime, parseMembers, useCache } = parseObjectTypes<IDubberGetOneByQueryProps>(req.query);
  const CSRFToken = req.header(config.vars.csrfHeader);

  // Ensure that only client get detailed document
  if (detailed !== undefined && CSRFToken !== undefined) {
    const middleware = new MiddlewareService();
    await middleware.checkCSRF(CSRFToken, [config.DOMAIN.nekomi]);

    detailed = true;
  }

  const { dubber, message, status, dubbedAnime, parsedMembers } = await DubberController.GetOneByQuery({ query, detailed, fetchDubbedAnime, parseMembers, useCache });

  return res.status(status).json({ message, dubber, dubbedAnime, parsedMembers });
});

const GetOne = [
  getOne,
];



//* ===================================== GET SEARCH
const getSearch = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const { q } = parseObjectTypes<IDubberGetSearch>(req.query);

  const { message, status, results } = await DubberController.GetSearch({ q });

  return res.status(status).json({ message, results });
});

const GetSearch = [
  CheckCSRF([config.DOMAIN.nekomi]),
  query(['q']).notEmpty().isString(),
  getSearch,
];



//* ===================================== PUT AVATAR
const putAvatar = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const file = req.file;
  if (!file) throw new ERR_INVALID_PAYLOAD(`File is not provided`);

  const { dubberId } = req.body as IDubberPutAvatarProps;
  const currentUser = req.nekomi.user!;

  const { message, status, url } = await DubberController.PutAvatar({ file, dubberId, currentUser });

  return res.status(status).json({ message, url });
});

const PutAvatar = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['dubberEditProfile']),
  upload.single('file'),
  body(['dubberId']).notEmpty().isString(),
  putAvatar,
];



//* ===================================== PUT BANNER
const putBanner = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const file = req.file;
  if (!file) throw new ERR_INVALID_PAYLOAD(`File is not provided`);

  const { dubberId } = req.body as IDubberPutBannerProps;
  const currentUser = req.nekomi.user!;

  const { message, status, url } = await DubberController.PutBanner({ file, dubberId, currentUser });

  return res.status(status).json({ message, url });
});

const PutBanner = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['dubberEditProfile']),
  upload.single('file'),
  body(['dubberId']).notEmpty().isString(),
  putBanner,
];


//* ===================================== PATCH SETTINGS
const patchSettings = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED('checkCSRF');
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED('checkAccess');

  const { dubberId, description, nameEng, nameUkr, socialLinks, supportLinks } = req.body as IDubberPatchSettingsProps;
  const { id: userId } = req.nekomi.user!;

  const { status, message, dubber } = await DubberController.PatchSettings({ dubberId, userId, description, nameEng, nameUkr, socialLinks, supportLinks, currentUser: req.nekomi.user! });

  return res.status(status).json({ message, dubber });
});

const PatchSettings = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['dubberEditProfile']),
  body(['dubberId']).notEmpty().isString(),
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
  param('id').notEmpty().isString(),
  getInviteById,
];



//* ===================================== POST INVITE SEND
const postInviteSend = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED('checkCSRF');
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED('checkAccess');

  const { userId, dubberId } = req.body as IDubberPostInviteSADProps;

  const { message, status } = await DubberController.PostInviteSend({ dubberId, userId, currentUser: req.nekomi.user });

  return res.status(status).json({ message });
});

const PostInviteSend = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['dubberEditMembers']),
  body(['userId', 'dubberId']).notEmpty().isString(),
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
  body(['dubberId']).notEmpty().isString(),
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
  body(['dubberId']).notEmpty().isString(),
  postInviteDecline,
];



//* ===================================== PATCH MEMBER BY ID
const patchMemberById = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED('checkCSRF');
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED('checkAccess');

  const { dubberId, role, userId } = req.body as IDubberPatchMemberByIdProps;

  const { message, status } = await DubberController.PatchMemberById({ dubberId, userId, role, currentUser: req.nekomi.user! });

  return res.status(status).json({ message });
});

const PatchMemberById = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['dubberEditEditors']),
  body(['dubberId', 'userId']).notEmpty().isString(),
  patchMemberById,
];



//* ===================================== DELETE MEMBER BY ID
const deleteMemberById = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED('checkCSRF');
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED('checkAccess');

  const { dubberId, userId } = req.body as IDubberDeleteMemberByIdProps;

  const { message, status } = await DubberController.DeleteMemberById({ dubberId, userId, currentUser: req.nekomi.user! });

  return res.status(status).json({ message });
});

const DeleteMemberById = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['dubberEditEditors']),
  body(['dubberId', 'userId']).notEmpty().isString(),
  deleteMemberById,
];



export default class DubberRoutes {
  static GetOne = GetOne;
  static GetSearch = GetSearch;
  static PutAvatar = PutAvatar;
  static PutBanner = PutBanner;

  static PatchSettings = PatchSettings;

  static GetInviteById = GetInviteById;
  static PostInviteSend = PostInviteSend;
  static PostInviteDecline = PostInviteDecline;
  static PostInviteAccept = PostInviteAccept;

  static PatchMemberById = PatchMemberById;
  static DeleteMemberById = DeleteMemberById;
}
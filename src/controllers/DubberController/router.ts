import * as DubberControllerOld from '../dubber';
import * as RouteValidation from '../../handlers/routeValidation';

import DubberController, { IDubberPatchSettingsProps } from './controller';
import express from 'express';
import { HTTPEndpoint } from '~/services/HTTPService';
import { body } from 'express-validator';



//* ===================================== PATCH SETTINGS
const PatchSettings = HTTPEndpoint(async (req, res) => {
  const { status, message, dubber } = await DubberController.PatchSettings(req.body);

  return res.status(status).json({ message, dubber });
});













//* ===================================== ROUTER
const DubberRouter = express.Router();

DubberRouter.patch('/settings', [
  body(['id'] as (keyof IDubberPatchSettingsProps)[]).notEmpty(),
  PatchSettings
]);




DubberRouter.get(`/all`, DubberControllerOld.getAll);

DubberRouter.post(`/invite/send`, RouteValidation.dubberInviteSend, DubberControllerOld.inviteSend);
DubberRouter.post(`/invite/accept`, RouteValidation.dubberInviteAcceptDecline, DubberControllerOld.inviteAccept);
DubberRouter.post(`/invite/decline`, RouteValidation.dubberInviteAcceptDecline, DubberControllerOld.inviteDecline);

DubberRouter.patch(`/settings/member/edit`, RouteValidation.dubberSettingsMemberEdit, DubberControllerOld.settingsMemberEdit);
DubberRouter.post(`/settings/member/exclude`, RouteValidation.dubberSettingsMemberExclude, DubberControllerOld.settingsMemberExclude);

//! Must be below all endpoints
DubberRouter.get(`/:query`, DubberControllerOld.getOne);
DubberRouter.get(`/invite/:dubber_id`, RouteValidation.dubberInviteVerify, DubberControllerOld.inviteVerify);



export default DubberRouter;
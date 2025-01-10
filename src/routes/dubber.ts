import * as DubberControllerOld from '../controllers/dubber';
import * as RouteValidation from '../handlers/routeValidation';
import DubberRoutes from '~/controllers/DubberController';
import express from 'express';
import { IDubberPatchSettingsProps } from '~/controllers/DubberController/controller';
import { body } from 'express-validator';



const DubberRouter = express.Router();



DubberRouter.patch('/settings', [
  body(['id'] as (keyof IDubberPatchSettingsProps)[]).notEmpty(),
  DubberRoutes.PatchSettings,
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
import * as DubberControllerOld from '../controllers/dubber';
import * as RouteValidation from '../handlers/routeValidation';
import DubberRoutes from '~/controllers/DubberController';
import express from 'express';



const DubberRouter = express.Router();


//* Generic
DubberRouter.get(`/:query`, DubberRoutes.GetOne);

//* Settings
DubberRouter.patch('/settings', DubberRoutes.PatchSettings);

//* Invite
DubberRouter.get(`/invite/:id`, DubberRoutes.GetInviteById);
DubberRouter.post(`/invite/send`, DubberRoutes.PostInviteSend);
DubberRouter.post(`/invite/accept`, DubberRoutes.PostInviteAccept);
DubberRouter.post(`/invite/decline`, DubberRoutes.PostInviteDecline);

//* Member
/** Path /settings/member/edit is deprecated */
DubberRouter.patch([`/settings/member/edit`, `/member/edit`], RouteValidation.dubberSettingsMemberEdit, DubberControllerOld.settingsMemberEdit);
/** Path /settings/member/exclude is deprecated */
DubberRouter.post([`/settings/member/exclude`, `/member/kick`], RouteValidation.dubberSettingsMemberExclude, DubberControllerOld.settingsMemberExclude);

/** @deprecated */
DubberRouter.get(`/all`, DubberControllerOld.getAll);



export default DubberRouter;
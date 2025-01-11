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
DubberRouter.patch(`/member`, DubberRoutes.PatchMemberById);
DubberRouter.delete(`/member`, DubberRoutes.DeleteMemberById);


//! DEPRECATED
/** @deprecated use PATCH /dubber/member instead */
DubberRouter.patch([`/settings/member/edit`], RouteValidation.dubberSettingsMemberEdit, DubberControllerOld.settingsMemberEdit);
/** @deprecated use DELETE /dubber/member instead */
DubberRouter.post([`/settings/member/exclude`], RouteValidation.dubberSettingsMemberExclude, DubberControllerOld.settingsMemberExclude);
/** @deprecated use search?q=~all instead */
DubberRouter.get(`/all`, DubberControllerOld.getAll);



export default DubberRouter;
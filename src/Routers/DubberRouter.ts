import * as DubberControllerOld from '../Controllers/dubber';
import DubberRoutes from '~/Controllers/Dubber/DubberRoutes';
import express from 'express';



const DubberRouter = express.Router();


//* Generic
DubberRouter.get(`/:query`, DubberRoutes.GetOne);
DubberRouter.get(`/search`, DubberRoutes.GetSearch);
DubberRouter.put(`/avatar`, DubberRoutes.PutAvatar);
DubberRouter.put(`/banner`, DubberRoutes.PutBanner);

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
/** @deprecated use dubber/search?q=~all instead */
DubberRouter.get(`/all`, DubberControllerOld.getAll);



export default DubberRouter;
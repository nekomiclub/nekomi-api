import DubberRoutes from '~/controllers/Dubber/DubberRoutes';
import express from 'express';



const DubberRouter = express.Router();


DubberRouter.get(`/search`, DubberRoutes.GetSearch);
DubberRouter.get(`/invite/:id`, DubberRoutes.GetInviteById);
DubberRouter.get(`/:query`, DubberRoutes.GetOne);

DubberRouter.post(`/invite/send`, DubberRoutes.PostInviteSend);
DubberRouter.post(`/invite/accept`, DubberRoutes.PostInviteAccept);
DubberRouter.post(`/invite/decline`, DubberRoutes.PostInviteDecline);

DubberRouter.put(`/avatar`, DubberRoutes.PutAvatar);
DubberRouter.put(`/banner`, DubberRoutes.PutBanner);

DubberRouter.patch('/settings', DubberRoutes.PatchSettings);
DubberRouter.patch(`/member`, DubberRoutes.PatchMemberById);

DubberRouter.delete(`/member`, DubberRoutes.DeleteMemberById);



export default DubberRouter;
import UserDeleteRoute from './UserDelete.route';
import UserGetLibRoute from './UserGetLib.route';
import UserGetRoute from './UserGet.route';
import UserGetSearchRoute from './UserGetSearch.route';
import UserPatchSettingsRoute from './UserPatchSettings.route';
import UserPutAvatarRoute from './UserPutAvatar.route';
import UserPutCoverRoute from './UserPutCover.route';
import express from 'express';



const UserRouter = express.Router();



UserRouter.get('/search', UserGetSearchRoute);
UserRouter.get(['/', '/:query'], UserGetRoute);
UserRouter.get('/:userId/lib/:libId', UserGetLibRoute);

UserRouter.patch(['/settings', '/settings/:id'], UserPatchSettingsRoute);

UserRouter.put(['/settings/avatar', '/settings/:id/avatar'], UserPutAvatarRoute);
UserRouter.put(['/settings/cover', '/settings/:id/cover'], UserPutCoverRoute);

UserRouter.delete(['/', '/:id'], UserDeleteRoute);



export default UserRouter;
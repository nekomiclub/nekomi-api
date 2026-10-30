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
UserRouter.get('/:query/lib/:libId', UserGetLibRoute);

UserRouter.patch(['/', '/:id'], UserPatchSettingsRoute);

UserRouter.put(['/avatar', '/:id/avatar'], UserPutAvatarRoute);
UserRouter.put(['/cover', '/:id/cover'], UserPutCoverRoute);

UserRouter.delete(['/', '/:id'], UserDeleteRoute);



export default UserRouter;
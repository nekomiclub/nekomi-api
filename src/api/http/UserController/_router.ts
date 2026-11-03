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
UserRouter.get(['/', '/:qr'], UserGetRoute);
UserRouter.get('/:qr/lib/:libId', UserGetLibRoute);

UserRouter.patch('/:id', UserPatchSettingsRoute);

UserRouter.put('/:id/avatar', UserPutAvatarRoute);
UserRouter.put('/:id/cover', UserPutCoverRoute);

UserRouter.delete('/:id', UserDeleteRoute);



export default UserRouter;
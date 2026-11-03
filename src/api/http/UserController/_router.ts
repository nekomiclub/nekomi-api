import UserDeleteRoute from './UserDelete.route.js';
import UserGetLibRoute from './UserGetLib.route.js';
import UserGetRoute from './UserGet.route.js';
import UserGetSearchRoute from './UserGetSearch.route.js';
import UserPatchSettingsRoute from './UserPatchSettings.route.js';
import UserPutAvatarRoute from './UserPutAvatar.route.js';
import UserPutCoverRoute from './UserPutCover.route.js';
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
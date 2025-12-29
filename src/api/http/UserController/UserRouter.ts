import UserDeleteRoute from './UserDelete.route';
import UserGetRoute from './UserGet.route';
import UserGetSearchRoute from './UserGetSearch.route';
import UserPatchSettingsRoute from './UserPatchSettings.route';
import UserPutAvatarRoute from './UserPutAvatar.route';
import UserPutCoverRoute from './UserPutCover.route';
import express from 'express';



const UserRouter = express.Router();



UserRouter.get('/search', UserGetSearchRoute);
UserRouter.get('/:query', UserGetRoute);

UserRouter.patch('/settings/:id', UserPatchSettingsRoute);

UserRouter.put('/settings/:id/avatar', UserPutAvatarRoute);
UserRouter.put('/settings/:id/cover', UserPutCoverRoute);

UserRouter.delete('/:id', UserDeleteRoute);



export default UserRouter;
import UserController from '~/controllers/User/UserController';
import express from 'express';



const UserRouter = express.Router();



UserRouter.get(`/search`, UserController.GetSearch);
UserRouter.get(`/logout`, UserController.GetLogout);
UserRouter.get(`/link/telegram/token`, UserController.GetLinkTelegramToken);
UserRouter.get(`/:query`, UserController.GetByQuery);

UserRouter.post(`/signin`, UserController.PostSignin);
UserRouter.post(`/link/telegram`, UserController.PostLinkTelegram);
UserRouter.post(`/link/telegram/verify`, UserController.PostLinkTelegramTokenVerify);

UserRouter.patch(`/`, UserController.PatchUser);

UserRouter.put('/banner', UserController.PutBanner);



export default UserRouter;
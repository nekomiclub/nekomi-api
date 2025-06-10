import UserController from '~/controllers/User/UserController';
import express from 'express';



const UserRouter = express.Router();



UserRouter.get(`/search`, UserController.GetSearch);
UserRouter.get(`/logout`, UserController.GetLogout);
UserRouter.get([`/link/telegram/token`, `/linkTelegram/token`], UserController.GetLinkTelegramToken); //* /linkTelegram/token is deprecated
UserRouter.get(`/:query`, UserController.GetByQuery);

UserRouter.post(`/signin`, UserController.PostSignin);
UserRouter.post([`/link/telegram`, `/linkTelegram`], UserController.PostLinkTelegram); //* /linkTelegram is deprecated
UserRouter.post([`/link/telegram/verify`, `/linkTelegram/verify`], UserController.PostLinkTelegramTokenVerify); //* /linkTelegram/verify is deprecated

UserRouter.patch([`/me`, `/`], UserController.PatchUser); //* / is deprecated



export default UserRouter;
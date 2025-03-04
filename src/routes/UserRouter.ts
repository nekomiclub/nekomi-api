import * as RouteValidation from '../handlers/routeValidation';
import * as UserController from '../controllers/user';
import UserRoutes from '~/controllers/User/UserRoutes';
import express from 'express';


const UserRouter = express.Router();



//* Generic
UserRouter.get(`/search`, UserRoutes.GetSearch);





//* ------------------ USER ROUTER ------------------
UserRouter.get(`/:query`, UserController.getQuery);
UserRouter.get(`/logout`, RouteValidation.userLogout, UserController.getLogout);
UserRouter.get(`/validate`, RouteValidation.userValidate, UserController.getValidate);
UserRouter.post(`/signin`, RouteValidation.userSignin, UserController.postSignin);

UserRouter.get([`/link/telegram/token`, `/linkTelegram/token`], RouteValidation.userLinkTelegramToken, UserController.getLinkTelegramToken); //* /linkTelegram/token is deprecated
UserRouter.post([`/link/telegram`, `/linkTelegram`], RouteValidation.userLinkTelegram, UserController.postLinkTelegram); //* /linkTelegram is deprecated
UserRouter.post([`/link/telegram/verify`, `/linkTelegram/verify`], RouteValidation.userLinkTelegramTokenVerify, UserController.postLinkTelegramTokenVerify); //* /linkTelegram/verify is deprecated

UserRouter.patch([`/me`, `/`], RouteValidation.userPatch, UserController.patchUser); //* / is deprecated

UserRouter.post('/together', RouteValidation.userPostTogether, UserController.createTogetherRoom);
// UserRouter.patch('/together/:id', UserController.getQuery);
UserRouter.delete('/together/:id', RouteValidation.userDeleteTogether, UserController.deleteTogetherRoom);



export default UserRouter;
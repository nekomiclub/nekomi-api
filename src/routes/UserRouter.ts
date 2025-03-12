import * as UserController from '~/controllers/user';
import UserRoutes from '~/controllers/User/UserRoutes';
import express from 'express';
import multer from 'multer';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { body } from 'express-validator';
import { config } from '~/config';



const upload = multer();
const UserRouter = express.Router();



export const userLinkTelegram = [
  CheckCSRF([config.DOMAIN.nekomi_bot]),
  body(['animeeID', 'telegramID'])
    .notEmpty().withMessage('AnimeeID and TelegramID must be provided')
];

export const userLinkTelegramToken = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic'])
];

export const userLinkTelegramTokenVerify = [
  CheckCSRF([config.DOMAIN.nekomi_bot]),
  body('token')
    .notEmpty().withMessage('Token can not be empty')
];

export const userSignin = [
  CheckCSRF([config.DOMAIN.nekomi]),
  body('session')
    .notEmpty().withMessage('Session can not be empty'),
];

export const userLogout = [
  CheckCSRF([config.DOMAIN.nekomi]),
];

export const userValidate = [
  CheckCSRF([config.DOMAIN.nekomi]),
];

export const userPostTogether = [
  body('titleId')
    .notEmpty().withMessage('Title id can not be empty'),
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
];

export const userDeleteTogether = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
];



UserRouter.get(`/search`, UserRoutes.GetSearch);
UserRouter.get(`/logout`, userLogout, UserController.getLogout);
UserRouter.get(`/validate`, userValidate, UserController.getValidate);
UserRouter.get([`/link/telegram/token`, `/linkTelegram/token`], userLinkTelegramToken, UserController.getLinkTelegramToken); //* /linkTelegram/token is deprecated
UserRouter.get(`/:query/lib/:libId`, UserRoutes.GetLib);
UserRouter.get(`/:query/together/:roomId`, UserRoutes.GetTogetherRoom);
UserRouter.get(`/:query`, UserRoutes.GetByQuery);

UserRouter.post(`/signin`, userSignin, UserController.postSignin);
UserRouter.post([`/link/telegram`, `/linkTelegram`], userLinkTelegram, UserController.postLinkTelegram); //* /linkTelegram is deprecated
UserRouter.post([`/link/telegram/verify`, `/linkTelegram/verify`], userLinkTelegramTokenVerify, UserController.postLinkTelegramTokenVerify); //* /linkTelegram/verify is deprecated
UserRouter.post('/together', userPostTogether, UserController.createTogetherRoom);

UserRouter.patch([`/me`, '/:id', `/`], UserRoutes.PatchUser); //* / is deprecated

UserRouter.delete('/together/:id', userDeleteTogether, UserController.deleteTogetherRoom);



export default UserRouter;
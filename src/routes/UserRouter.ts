import * as UserController from '~/controllers/user';
import UserRoutes from '~/controllers/User/UserRoutes';
import express from 'express';
import multer from 'multer';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { body } from 'express-validator';
import { config } from '~/config';



const upload = multer();
const UserRouter = express.Router();



export const userPatch = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  upload.single('file'),
  body('method')
    .notEmpty().withMessage('Patch method must be provided')
];

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




//* Generic
UserRouter.get(`/search`, UserRoutes.GetSearch);





//* ------------------ USER ROUTER ------------------
UserRouter.get(`/:query`, UserController.getQuery);
UserRouter.get(`/logout`, userLogout, UserController.getLogout);
UserRouter.get(`/validate`, userValidate, UserController.getValidate);
UserRouter.post(`/signin`, userSignin, UserController.postSignin);

UserRouter.get([`/link/telegram/token`, `/linkTelegram/token`], userLinkTelegramToken, UserController.getLinkTelegramToken); //* /linkTelegram/token is deprecated
UserRouter.post([`/link/telegram`, `/linkTelegram`], userLinkTelegram, UserController.postLinkTelegram); //* /linkTelegram is deprecated
UserRouter.post([`/link/telegram/verify`, `/linkTelegram/verify`], userLinkTelegramTokenVerify, UserController.postLinkTelegramTokenVerify); //* /linkTelegram/verify is deprecated

UserRouter.patch([`/me`, `/`], userPatch, UserController.patchUser); //* / is deprecated

UserRouter.post('/together', userPostTogether, UserController.createTogetherRoom);
// UserRouter.patch('/together/:id', UserController.getQuery);
UserRouter.delete('/together/:id', userDeleteTogether, UserController.deleteTogetherRoom);



export default UserRouter;
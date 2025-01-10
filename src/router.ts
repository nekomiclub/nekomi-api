import express from 'express';

import * as RouteValidation from './handlers/routeValidation';

import * as RootController from './controllers/root';
import * as TitleController from './controllers/title';
import * as UserController from './controllers/user';
import DubberRouter from './controllers/DubberController/router';




const RootRouter = express.Router();
const UserRouter = express.Router();
const TitleRouter = express.Router();

export default {
  RootRouter,
  UserRouter,
  TitleRouter,
  DubberRouter
};



//* ------------------ ROOT ROUTER ------------------
RootRouter.get(['/', '/ping'], RootController.getPing);

RootRouter.get('/search', RouteValidation.getSearch, RootController.getSearch);
RootRouter.post('/upload', RouteValidation.postUpload, RootController.postUpload);
RootRouter.delete('/upload/:id', RouteValidation.deleteUpload, RootController.deleteUpload);




//* ------------------ TITLE ROUTER ------------------
TitleRouter.get(['/all', '/total'], TitleController.getTotal); //* /total is deprecated

TitleRouter.get('/home_wrapped', RouteValidation.getHomeWrapped, TitleController.getHomeWrapped);
TitleRouter.post('/', RouteValidation.postTitle, TitleController.postTitle);

//! Must be below all endpoints
TitleRouter.get('/:query', TitleController.getTitleQuery);
TitleRouter.patch('/:id', RouteValidation.patchTitleId, TitleController.patchTitle);
TitleRouter.delete('/:id', RouteValidation.deleteTitleId, TitleController.deleteTitle);



//* ------------------ USER ROUTER ------------------
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


//! Must be below all endpoints
UserRouter.get(`/:query`, UserController.getQuery);
import express from 'express';

import * as RouteValidation from './handlers/routeValidation';



const RootRouter = express.Router();

const UserRouter = express.Router();
const TitleRouter = express.Router();
const DubberRouter = express.Router();

export default {
  RootRouter,
  UserRouter,
  TitleRouter,
  DubberRouter
};



//* ------------------ ROOT ROUTER ------------------
import * as RootController from './controllers/root';

RootRouter.get('/search', RouteValidation.getSearch, RootController.getSearch);
RootRouter.post('/upload', RouteValidation.postUpload, RootController.postUpload);
RootRouter.delete('/upload/:id', RouteValidation.deleteUpload, RootController.deleteUpload);




//* ------------------ TITLE ROUTER ------------------
import * as TitleController from './controllers/title';

TitleRouter.get('/total', TitleController.getTotal);
TitleRouter.get('/home_wrapped', RouteValidation.getHomeWrapped, TitleController.getHomeWrapped);
TitleRouter.post('/', RouteValidation.postTitle, TitleController.postTitle);

//! Must be below all endpoints
TitleRouter.patch('/:id', RouteValidation.patchTitleId, TitleController.patchTitle);
TitleRouter.delete('/:id', RouteValidation.deleteTitleId, TitleController.deleteTitle);
TitleRouter.get('/:query', TitleController.getTitleQuery);



//* ------------------ DUBBER ROUTER ------------------
import * as DubberController from './controllers/dubber';

DubberRouter.get(`/all`, DubberController.getAll);

//! Must be below all endpoints
DubberRouter.get(`/:query`, DubberController.getOne);



//* ------------------ USER ROUTER ------------------
import * as UserController from './controllers/user';

UserRouter.get(`/logout`, RouteValidation.userLogout, UserController.getLogout);
UserRouter.get(`/validate`, RouteValidation.userValidate, UserController.getValidate);
UserRouter.get(`/linkTelegram/token`, RouteValidation.userLinkTelegramToken, UserController.getLinkTelegramToken);

UserRouter.post(`/signin`, RouteValidation.userSignin, UserController.postSignin);
UserRouter.post(`/linkTelegram`, RouteValidation.userLinkTelegram, UserController.postLinkTelegram);
UserRouter.post(`/linkTelegram/verify`, RouteValidation.userLinkTelegramTokenVerify, UserController.postLinkTelegramTokenVerify);

UserRouter.patch(`/`, RouteValidation.userPatch, UserController.patchUser);

//! Must be below all endpoints
UserRouter.get(`/:query`, UserController.getQuery);
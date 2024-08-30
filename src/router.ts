import express from 'express';

import * as RouteValidation from './handlers/routeValidation';



export const RootRouter = express.Router();

export const UserRouter = express.Router();
export const TitleRouter = express.Router();
export const DubberRouter = express.Router();

export const DevRouter = express.Router();



//* ------------------ DEV ROUTER ------------------
// Test-only routes
import * as DevController from './controllers/dev';

DevRouter.get('/AccessControl', RouteValidation.devGetAccessControl, DevController.getAccessControl);
DevRouter.get('/CSRFCheck', RouteValidation.devGetCSRFCheck, DevController.getCSRFCheck);



//* ------------------ ROOT ROUTER ------------------
import * as RootController from './controllers/root';

RootRouter.get('/search', RouteValidation.getSearch, RootController.getSearch);




//* ------------------ TITLE ROUTER ------------------
import * as TitleController from './controllers/title';

TitleRouter.get('/total', TitleController.getTotal);
TitleRouter.get('/popular', RouteValidation.getTitlePopular, TitleController.getPopular);
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
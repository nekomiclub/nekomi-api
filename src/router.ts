import express from 'express';

import * as RouteValidation from './handlers/routeValidation';

import * as DubberController from './controllers/dubber';
import * as RootController from './controllers/root';
import * as TitleController from './controllers/title';
import * as UserController from './controllers/user';



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
RootRouter.get('/', RootController.getPing);
RootRouter.get('/ping', RootController.getPing);

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



//* ------------------ DUBBER ROUTER ------------------
DubberRouter.get(`/all`, DubberController.getAll);



DubberRouter.post(`/invite/send`, RouteValidation.dubberInviteSend, DubberController.inviteSend);
DubberRouter.post(`/invite/accept`, RouteValidation.dubberInviteAcceptDecline, DubberController.inviteAccept);
DubberRouter.post(`/invite/decline`, RouteValidation.dubberInviteAcceptDecline, DubberController.inviteDecline);

DubberRouter.post(`/settings/member/edit`, DubberController.getAll);
DubberRouter.post(`/settings/member/exclude`, RouteValidation.dubberSettingsMemberExclude, DubberController.settingsMemberExclude);

//! Must be below all endpoints
DubberRouter.get(`/:query`, DubberController.getOne);
DubberRouter.get(`/invite/:dubber_id`, RouteValidation.dubberInviteVerify, DubberController.inviteVerify);



//* ------------------ USER ROUTER ------------------
UserRouter.get(`/logout`, RouteValidation.userLogout, UserController.getLogout);
UserRouter.get(`/validate`, RouteValidation.userValidate, UserController.getValidate);
UserRouter.post(`/signin`, RouteValidation.userSignin, UserController.postSignin);

UserRouter.get([`/link/telegram/token`, `/linkTelegram/token`], RouteValidation.userLinkTelegramToken, UserController.getLinkTelegramToken); //* /linkTelegram/token is deprecated
UserRouter.post([`/link/telegram`, `/linkTelegram`], RouteValidation.userLinkTelegram, UserController.postLinkTelegram); //* /linkTelegram is deprecated
UserRouter.post([`/link/telegram/verify`, `/linkTelegram/verify`], RouteValidation.userLinkTelegramTokenVerify, UserController.postLinkTelegramTokenVerify); //* /linkTelegram/verify is deprecated

UserRouter.patch([`/me`, `/`], RouteValidation.userPatch, UserController.patchUser); //* / is deprecated


//! Must be below all endpoints
UserRouter.get(`/:query`, UserController.getQuery);
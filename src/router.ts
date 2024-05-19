import express from 'express';
import multer from 'multer';
import path from 'path';
import * as uuid from 'uuid';
import { body, cookie, param, query } from 'express-validator';
import ip from 'ip';

import * as RouteValidation from './handlers/routeValidation';
import * as v1C from './controllers/v1/index';
import * as v1CTitle from './controllers/v1/title';
import * as v1CDubber from './controllers/v1/dubber';
import * as v1CWS from './controllers/v1/ws';
import * as v1CProxy from './controllers/v1/proxy';


/** @deprecated use specified routers */
export const ApiV1 = express.Router();
export const ProxyRouter = express.Router();

export const UserRouter = express.Router();
export const TitleRouter = express.Router();

export const DevRouter = express.Router();



//* ------------------ DEV ROUTER ------------------
// Test-only routes
import * as DevController from './controllers/dev';

DevRouter.get('/AccessControll', RouteValidation.devGetAccessControll, DevController.getAccessControl);




//* ------------------ TITLE ROUTER ------------------
import * as TitleController from './controllers/title';

TitleRouter.get('/total', TitleController.getTotal);
TitleRouter.post('/', RouteValidation.postTitle, RouteValidation.privateCORS, TitleController.postTitle);
TitleRouter.patch('/:id', RouteValidation.patchTitleId, TitleController.patchTitle);
TitleRouter.delete('/:id', RouteValidation.deleteTitleId, TitleController.deleteTitle);



/** @deprecated */
ApiV1.get(`/titles`, RouteValidation.privateCORS, v1CTitle.getMany);
/** @deprecated */
ApiV1.get(`/titles/search`, RouteValidation.privateCORS, v1CTitle.search);



//! Must be below all endpoints
TitleRouter.get('/:query', RouteValidation.privateCORS, TitleController.getTitleQuery);



//* ------------------ DUBBER ROUTER ------------------
ApiV1.get(`/dubber/:query`, RouteValidation.privateCORS, v1CDubber.getOne);
ApiV1.post(`/dubber/parse`, RouteValidation.privateCORS, RouteValidation.postDubbersParse, v1CDubber.parse);



//* ------------------ USER ROUTER ------------------
import * as UserController from './controllers/user';

UserRouter.get(`/logout`, RouteValidation.privateCORS, UserController.getLogout);
UserRouter.get(`/:query`, RouteValidation.privateCORS, UserController.getQuery);
UserRouter.post(`/signin`, RouteValidation.userSignin, UserController.postSignin);
UserRouter.patch(`/`, RouteValidation.privateCORS, RouteValidation.userPatch, UserController.patchUser);



//* ------------------ PROXY ROUTER ------------------
//! Testing proxy routes require available microservices. Tested for proxy routes will be written in future.

/** @deprecated post snap was deprecated due to refusal of posting posts of new episodes in tg channel */
ProxyRouter.post('/postSnap', v1CProxy.createSnap); //* Require animee-uploads-bot microservice
ProxyRouter.post('/parseMetadata', v1CProxy.parseMetadata); //* Require animee-uploads-bot microservice



//* ------------------ SERVICE ROUTER ------------------
ApiV1.get(`/uptime`, v1C.uptime);



//* ------------------ ALLIASES ------------------

import express from 'express';

import * as RouteValidation from './handlers/routeValidation';

import * as RootController from './controllers/root';
import * as TitleController from './controllers/title';
import DubberRouter from './routes/DubberRouter';
import UserRouter from './routes/UserRouter';




const RootRouter = express.Router();
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
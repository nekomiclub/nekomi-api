import * as RouteValidation from '../handlers/routeValidation';
import * as TitleController from '../controllers/title';
import express from 'express';



const AnimeRouter = express.Router();



AnimeRouter.get(['/all', '/total'], TitleController.getTotal); //* /total is deprecated

AnimeRouter.get('/home_wrapped', RouteValidation.getHomeWrapped, TitleController.getHomeWrapped);
AnimeRouter.post('/', RouteValidation.postTitle, TitleController.postTitle);

//! Must be below all endpoints
AnimeRouter.get('/:query', TitleController.getTitleQuery);
AnimeRouter.patch('/:id', RouteValidation.patchTitleId, TitleController.patchTitle);
AnimeRouter.delete('/:id', RouteValidation.deleteTitleId, TitleController.deleteTitle);



export default AnimeRouter;
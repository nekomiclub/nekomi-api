import express from 'express';

import * as RouteValidation from '../handlers/routeValidation';
import * as TitleController from '../Controllers/title';
import AnimeRoutes from '~/controllers/Anime/AnimeRoutes';



const AnimeRouter = express.Router();



//* Generic
AnimeRouter.get(`/search`, AnimeRoutes.GetSearch);



AnimeRouter.get(['/all', '/total'], TitleController.getTotal); //* /total is deprecated

AnimeRouter.get('/home_wrapped', RouteValidation.getHomeWrapped, TitleController.getHomeWrapped);
AnimeRouter.post('/', RouteValidation.postTitle, TitleController.postTitle);

//! Must be below all endpoints
AnimeRouter.get('/:query', TitleController.getTitleQuery);
AnimeRouter.patch('/:id', RouteValidation.patchTitleId, TitleController.patchTitle);
AnimeRouter.delete('/:id', RouteValidation.deleteTitleId, TitleController.deleteTitle);



export default AnimeRouter;
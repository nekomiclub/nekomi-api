import express from 'express';

import * as TitleController from '~/controllers/title';
import AnimeRoutes from '~/controllers/Anime/AnimeRoutes';
import multer from 'multer';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { config } from '~/config';



const upload = multer();
const AnimeRouter = express.Router();



export const getHomeWrapped = [
  CheckCSRF([config.DOMAIN.nekomi]),
];

export const postTitle = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['titleAdd']),
];

export const patchTitleId = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  upload.single('file'),
];

export const deleteTitleId = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['titleDelete']),
];



//* Generic
AnimeRouter.get(`/search`, AnimeRoutes.GetSearch);



AnimeRouter.get(['/all', '/total'], TitleController.getTotal); //* /total is deprecated

AnimeRouter.get('/home_wrapped', getHomeWrapped, TitleController.getHomeWrapped);
AnimeRouter.post('/', postTitle, TitleController.postTitle);

//! Must be below all endpoints
AnimeRouter.get('/:query', TitleController.getTitleQuery);
AnimeRouter.patch('/:id', patchTitleId, TitleController.patchTitle);
AnimeRouter.delete('/:id', deleteTitleId, TitleController.deleteTitle);



export default AnimeRouter;
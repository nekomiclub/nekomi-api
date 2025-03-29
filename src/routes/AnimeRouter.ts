import express from 'express';

import * as TitleController from '~/controllers/title';
import AnimeRoutes from '~/controllers/Anime/AnimeRoutes';
import multer from 'multer';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { config } from '~/config';



const upload = multer();
const AnimeRouter = express.Router();



export const patchTitleId = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  upload.single('file'),
];



//* Generic
AnimeRouter.get([`/all`, '/total'], AnimeRoutes.GetAll);
AnimeRouter.get(`/search`, AnimeRoutes.GetSearch);
AnimeRouter.get('/featured', AnimeRoutes.GetFeatured);
AnimeRouter.get('/:query', AnimeRoutes.GetByQuery);

AnimeRouter.post('/', AnimeRoutes.PostAnime);
AnimeRouter.post('/episode'); // TODO:

AnimeRouter.put('/poster', AnimeRoutes.PutPoster);

AnimeRouter.patch('/:uuid', patchTitleId, TitleController.patchTitle);

AnimeRouter.delete('/episode'); // TODO:
AnimeRouter.delete('/:uuid', AnimeRoutes.DeleteByUuid);




export default AnimeRouter;
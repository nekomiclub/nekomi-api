import express from 'express';

import AnimeRoutes from '~/controllers/Anime/AnimeRoutes';



const AnimeRouter = express.Router();



//* Generic
AnimeRouter.get([`/all`, '/total'], AnimeRoutes.GetAll);
AnimeRouter.get(`/search`, AnimeRoutes.GetSearch);
AnimeRouter.get('/featured', AnimeRoutes.GetFeatured);
AnimeRouter.get('/:query', AnimeRoutes.GetByQuery);

AnimeRouter.post('/', AnimeRoutes.PostAnime);
AnimeRouter.post('/episode', AnimeRoutes.PostEpisode);

AnimeRouter.put('/poster', AnimeRoutes.PutPoster);

AnimeRouter.patch('/', AnimeRoutes.PatchByUuid);

AnimeRouter.delete('/episode', AnimeRoutes.DeleteEpisode);
AnimeRouter.delete('/:uuid', AnimeRoutes.DeleteByUuid);




export default AnimeRouter;
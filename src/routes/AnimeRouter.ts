import express from 'express';

import AnimeController from '~/controllers/Anime/AnimeController';



const AnimeRouter = express.Router();



//* Generic
AnimeRouter.get('/stats', AnimeController.GetStats);
AnimeRouter.get(`/search`, AnimeController.GetSearch);
AnimeRouter.get('/featured', AnimeController.GetFeatured);
AnimeRouter.get('/:query', AnimeController.GetByQuery);

AnimeRouter.post('/', AnimeController.PostAnime);
AnimeRouter.post('/episode', AnimeController.PostEpisode);

AnimeRouter.put('/poster', AnimeController.PutPoster);

AnimeRouter.patch('/', AnimeController.PatchByUuid);

AnimeRouter.delete('/episode', AnimeController.DeleteEpisode);
AnimeRouter.delete('/:uuid', AnimeController.DeleteByUuid);



export default AnimeRouter;
import AnimeGetEpisodesRoute from './AnimeGetEpisodes.route';
import AnimeGetForceParseRoute from './AnimeGetForceParse.route';
import AnimeGetRoute from './AnimeGet.route';
import AnimeGetSearchRoute from './AnimeGetSearch.route';
import express from 'express';



const AnimeRouter = express.Router();



AnimeRouter.get('/search', AnimeGetSearchRoute);
AnimeRouter.get('/:qr', AnimeGetRoute);
AnimeRouter.get('/:qr/episodes', AnimeGetEpisodesRoute);
AnimeRouter.get('/:qr/parse', AnimeGetForceParseRoute);

// AnimeRouter.post('/');

// AnimeRouter.patch('/:id');

// AnimeRouter.delete('/:id');



export default AnimeRouter;
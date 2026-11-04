import AnimeGetEpisodesRoute from './AnimeGetEpisodes.route.js';
import AnimeGetForceParseRoute from './AnimeGetForceParse.route.js';
import AnimeGetRoute from './AnimeGet.route.js';
import AnimeGetSearchRoute from './AnimeGetSearch.route.js';
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
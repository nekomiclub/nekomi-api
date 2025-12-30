import AnimeGetRoute from './AnimeGet.route';
import AnimeGetSearchRoute from './AnimeGetSearch.route';
import express from 'express';



const AnimeRouter = express.Router();



AnimeRouter.get('/search', AnimeGetSearchRoute);
AnimeRouter.get('/:query', AnimeGetRoute);

// AnimeRouter.post('/');

// AnimeRouter.patch('/:id');

// AnimeRouter.delete('/:id');



export default AnimeRouter;
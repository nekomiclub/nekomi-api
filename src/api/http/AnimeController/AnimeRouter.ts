import AnimeGetDocumentRoute from './AnimeGetDocument.route';
import express from 'express';



const AnimeRouter = express.Router();



AnimeRouter.get('/:query', AnimeGetDocumentRoute);



export default AnimeRouter;
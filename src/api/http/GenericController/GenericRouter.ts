import GenericGetPing from './GenericGetPing.route';
import express from 'express';



const GenericRouter = express.Router();

GenericRouter.get(['/', '/ping'], GenericGetPing);



export default GenericRouter;
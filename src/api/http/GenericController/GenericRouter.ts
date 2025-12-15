import GenericGetPingRoute from './GenericGetPing.route';
import express from 'express';



const GenericRouter = express.Router();

GenericRouter.get(['/', '/ping'], GenericGetPingRoute);



export default GenericRouter;
import GenericGetCSRFRoute from './GenericGetCSRF.route';
import GenericGetPingRoute from './GenericGetPing.route';
import express from 'express';



const GenericRouter = express.Router();



GenericRouter.get(['/', '/ping'], GenericGetPingRoute);
GenericRouter.get('/csrf', GenericGetCSRFRoute);



export default GenericRouter;
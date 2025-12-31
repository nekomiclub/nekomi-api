import GenericGetCSRFRoute from './GenericGetCSRF.route';
import GenericGetHomeFeedRoute from './GenericGetHomeFeed.route';
import GenericGetPingRoute from './GenericGetPing.route';
import express from 'express';



const GenericRouter = express.Router();



GenericRouter.get(['/', '/ping'], GenericGetPingRoute);
GenericRouter.get('/csrf', GenericGetCSRFRoute);
GenericRouter.get('/home-feed', GenericGetHomeFeedRoute);



export default GenericRouter;
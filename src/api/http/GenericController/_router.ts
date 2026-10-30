import express from 'express';

import GetCSRFRoute from './GetCSRF.route';
import GetHomeFeedRoute from './GetHomeFeed.route';
import GetPingRoute from './GetPing.route';



const GenericRouter = express.Router();



GenericRouter.get(['/', '/ping'], GetPingRoute);
GenericRouter.get('/csrf', GetCSRFRoute);
GenericRouter.get('/home-feed', GetHomeFeedRoute);



export default GenericRouter;
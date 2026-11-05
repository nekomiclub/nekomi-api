import express from 'express';

import GetHomeFeedRoute from './GetHomeFeed.route.js';
import GetPingRoute from './GetHealthcheck.route.js';



const GenericRouter = express.Router();



GenericRouter.get(['/', '/ping', '/healthcheck'], GetPingRoute);
GenericRouter.get('/home-feed', GetHomeFeedRoute);



export default GenericRouter;
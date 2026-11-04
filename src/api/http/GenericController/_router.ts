import express from 'express';

import GetHomeFeedRoute from './GetHomeFeed.route.js';
import GetPingRoute from './GetPing.route.js';



const GenericRouter = express.Router();



GenericRouter.get(['/', '/ping'], GetPingRoute);
GenericRouter.get('/home-feed', GetHomeFeedRoute);



export default GenericRouter;
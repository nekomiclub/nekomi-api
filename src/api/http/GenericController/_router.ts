import express from 'express';

import GetHomeFeedRoute from './GetHomeFeed.route';
import GetPingRoute from './GetPing.route';



const GenericRouter = express.Router();



GenericRouter.get(['/', '/ping'], GetPingRoute);
GenericRouter.get('/home-feed', GetHomeFeedRoute);



export default GenericRouter;
import express from 'express';

import DeleteFeedRoute from 'src/api/http/GenericController/DeleteFeed.route.js';
import GetHealthcheck from './GetHealthcheck.route.js';
import GetHomeFeedRoute from './GetFeed.route.js';
import PostFeedRoute from 'src/api/http/GenericController/PostFeed.route.js';



const GenericRouter = express.Router();



GenericRouter.get(['/', '/ping', '/healthcheck'], GetHealthcheck);

GenericRouter.get(['/feed', '/home-feed'], GetHomeFeedRoute);
GenericRouter.post('/feed', PostFeedRoute);
GenericRouter.delete('/feed/:anime_id', DeleteFeedRoute);



export default GenericRouter;
import express from 'express';

import DeleteFeedRoute from '~/api/http/GenericController/DeleteFeed.route.js';
import PostFeedRoute from '~/api/http/GenericController/PostFeed.route.js';

import GetHomeFeedRoute from './GetFeed.route.js';
import GetHealthcheck from './GetHealthcheck.route.js';



const GenericRouter = express.Router();



GenericRouter.get(['/', '/ping', '/healthcheck'], GetHealthcheck);

GenericRouter.get(['/feed', '/home-feed'], GetHomeFeedRoute);
GenericRouter.post('/feed', PostFeedRoute);
GenericRouter.delete('/feed/:anime_id', DeleteFeedRoute);



export default GenericRouter;
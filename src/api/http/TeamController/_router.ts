import TeamGetRoute from './TeamGet.route.js';
import TeamGetSearchRoute from './TeamGetSearch.route.js';
import TeamPutAvatarRoute from './TeamPutAvatar.route.js';
import TeamPutCoverRoute from './TeamPutCover.route.js';
import express from 'express';



const TeamRouter = express.Router();



TeamRouter.get('/search', TeamGetSearchRoute);
TeamRouter.get('/:qr', TeamGetRoute);

// DubberRouter.post('/');

// DubberRouter.patch('/:id');

TeamRouter.put('/:id/avatar', TeamPutAvatarRoute);
TeamRouter.put('/:id/cover', TeamPutCoverRoute);

// DubberRouter.delete('/:id');



export default TeamRouter;
import DubberGetRoute from './TeamGet.route';
import DubberGetSearchRoute from './TeamGetSearch.route';
import DubberPutAvatarRoute from './TeamPutAvatar.route';
import DubberPutCoverRoute from './TeamPutCover.route';
import express from 'express';



const TeamRouter = express.Router();



TeamRouter.get('/search', DubberGetSearchRoute);
TeamRouter.get('/:query', DubberGetRoute);

// DubberRouter.post('/');

// DubberRouter.patch('/:id');

TeamRouter.put('/:id/avatar', DubberPutAvatarRoute);
TeamRouter.put('/:id/cover', DubberPutCoverRoute);

// DubberRouter.delete('/:id');



export default TeamRouter;
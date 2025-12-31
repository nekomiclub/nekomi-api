import DubberGetRoute from './DubberGet.route';
import DubberGetSearchRoute from './DubberGetSearch.route';
import DubberPutAvatarRoute from './DubberPutAvatar.route';
import DubberPutCoverRoute from './DubberPutCover.route';
import express from 'express';



const DubberRouter = express.Router();



DubberRouter.get('/search', DubberGetSearchRoute);
DubberRouter.get('/:query', DubberGetRoute);

// DubberRouter.post('/');

// DubberRouter.patch('/:id');

DubberRouter.put('/:id/avatar', DubberPutAvatarRoute);
DubberRouter.put('/:id/cover', DubberPutCoverRoute);

// DubberRouter.delete('/:id');



export default DubberRouter;
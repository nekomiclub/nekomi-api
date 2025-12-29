import DubberGetSearchRoute from './DubberGetSearch.route';
import DubberPutAvatarRoute from './DubberPutAvatar.route';
import DubberPutCoverRoute from './DubberPutCover.route';
import express from 'express';



const DubberRouter = express.Router();



DubberRouter.get('/search', DubberGetSearchRoute);
DubberRouter.get('/:query');

DubberRouter.post('/');

DubberRouter.patch('/settings/:id');

DubberRouter.put('/settings/:id/avatar', DubberPutAvatarRoute);
DubberRouter.put('/settings/:id/cover', DubberPutCoverRoute);

DubberRouter.delete('/:id');



export default DubberRouter;
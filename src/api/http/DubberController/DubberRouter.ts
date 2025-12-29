import DubberGetSearchRoute from './DubberGetSearch.route';
import express from 'express';



const DubberRouter = express.Router();



DubberRouter.get('/search', DubberGetSearchRoute);
DubberRouter.get('/:query');

DubberRouter.post('/');

DubberRouter.patch('/settings/:id');

DubberRouter.put('/settings/:id/avatar');
DubberRouter.put('/settings/:id/cover');

DubberRouter.delete('/:id');



export default DubberRouter;
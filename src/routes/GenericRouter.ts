import * as RootController from '~/controllers/root';
import * as RouteValidation from '~/handlers/routeValidation';
import express from 'express';



const GenericRouter = express.Router();



GenericRouter.get(['/', '/ping'], RootController.getPing);

GenericRouter.get('/search', RouteValidation.getSearch, RootController.getSearch);
GenericRouter.post('/upload', RouteValidation.postUpload, RootController.postUpload);
GenericRouter.delete('/upload/:id', RouteValidation.deleteUpload, RootController.deleteUpload);



export default GenericRouter;
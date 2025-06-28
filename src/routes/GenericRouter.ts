import GenericController from '~/controllers/Generic/GenericController';
import express from 'express';



const GenericRouter = express.Router();



GenericRouter.get(['/', '/ping'], GenericController.GetPing);

GenericRouter.post('/upload', GenericController.PostUpload);

GenericRouter.delete('/upload/:id', GenericController.DeleteUpload);



export default GenericRouter;
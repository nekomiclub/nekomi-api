import * as RootController from '~/controllers/root';
import GenericRoutes from '~/controllers/Generic/GenericRoutes';
import express from 'express';
import multer from 'multer';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { body } from 'express-validator';
import { config } from '~/config';



const upload = multer();
const GenericRouter = express.Router();



export const postUpload = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['admin']),
  upload.single('file'),
  body('type')
    .notEmpty().withMessage('Type must be provided')
];

export const deleteUpload = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['admin']),
];



GenericRouter.get(['/', '/ping'], GenericRoutes.GetPing);

GenericRouter.post('/upload', postUpload, RootController.postUpload);
GenericRouter.delete('/upload/:id', deleteUpload, RootController.deleteUpload);



export default GenericRouter;
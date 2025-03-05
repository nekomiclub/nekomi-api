import * as RootController from '~/controllers/root';
import express from 'express';
import multer from 'multer';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { body } from 'express-validator';
import { config } from '~/config';



const upload = multer();
const GenericRouter = express.Router();



export const getSearch = [
  CheckCSRF([config.DOMAIN.nekomi]),
];

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



GenericRouter.get(['/', '/ping'], RootController.getPing);

GenericRouter.get('/search', getSearch, RootController.getSearch);
GenericRouter.post('/upload', postUpload, RootController.postUpload);
GenericRouter.delete('/upload/:id', deleteUpload, RootController.deleteUpload);



export default GenericRouter;
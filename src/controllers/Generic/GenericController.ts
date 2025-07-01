import NekomiUploads from '~/core/services/API/NekomiUploads.api';
import multer from 'multer';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { ERROR_GENERIC_FILE_MISS } from '~/services/Exceptions';
import { HTTPEndpoint } from '~/services/HTTPService';
import { NekomiUploadType } from '~/core/interfaces/API/NekomiUploadsAPI';
import { body } from 'express-validator';
import { config } from '~/config';



const upload = multer();



//* ===================================== GET PING
const getPing = HTTPEndpoint(async (req, res) => {
  return res.status(200).json({
    message: 'pong!',
    commit: config.commit,
    startedAt: config.startedAt
  });
});

/** @tested 2.1.0 */
const GetPing = [
  getPing
];



//* ===================================== POST UPLOAD
const postUpload = HTTPEndpoint(async (req, res) => {
  const userId = req.nekomi.user?.id as string;

  const file = req.file;
  if (!file) throw ERROR_GENERIC_FILE_MISS;

  const { type } = req.body as { type: NekomiUploadType };
  const { id, url, frames } = await NekomiUploads.uploadFile({ file, type, uploadedById: userId });

  return res.status(201).json({ message: `File uploaded`, url, id, frames });
}, {
  requireMiddlewares: ['checkAccess', 'checkCSRF']
});

const PostUpload = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['admin']),
  upload.single('file'),
  body('type')
    .notEmpty().withMessage('Type must be provided'),
  postUpload,
];



//* ===================================== DELETE UPLOAD ID
const deleteUpload = HTTPEndpoint(async (req, res) => {
  const { id } = req.params as { id: string };
  const userId = req.nekomi.user?.id as string;

  await NekomiUploads.deleteUpload({ id, deletedById: userId, withChildren: true });

  return res.status(200).json({ message: `Upload removed`, });
}, {
  requireMiddlewares: ['checkAccess', 'checkCSRF']
});

const DeleteUpload = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['admin']),
  deleteUpload,
];



const GenericController = {
  GetPing,

  PostUpload,

  DeleteUpload,
};

export default GenericController;
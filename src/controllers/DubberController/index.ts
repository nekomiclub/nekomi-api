import DubberController from './controller';
import { HTTPEndpoint } from '~/services/HTTPService';
import { query } from 'express-validator';



//* ===================================== GET ALL
const getAll = HTTPEndpoint(async (req, res) => {
  let { limit, page } = req.query as { limit?: number, page?: number };

  page = page ?? 0;
  limit = limit ?? 10;

  const { dubbers, total } = await DubberController.getAll({ limit, page });

  return res.status(200).json({
    message: 'ok',
    showed: dubbers.length,
    dubbers,
    total,
  });
});

const GetAll = [
  query(['limit', 'page']).notEmpty().toInt(),
  getAll,
];




export default class HTTPDubberRoutes {
  static GetAll = GetAll;
} 
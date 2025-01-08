import DubberService from '~/core/services/DubberService';
import { arrayPagination } from '~/handlers/handler';



//* ===================================== GET ALL
interface IGetAllProps {
  page: number
  limit: number
}

async function getAll({ limit, page }: IGetAllProps) {
  const dubbers = await new DubberService().getAll(false);

  return {
    total: dubbers.length,
    dubbers: arrayPagination({ elements: dubbers, limit, page })
  };
}





export default class DubberController {
  static getAll = getAll;
}
import AdminRepository from './AdminRepository';
import DTOService from '~/service/DataTransferService';
import Logger from '~/service/LoggerService';
import createId, { createNanoId } from '~/utils/create-id';
import { ADMIN_SLUG, AdminDubbersMapType } from '~/intf/IAdmin';
import { NekoError } from '~/service/ExceptionService';
import { TestMode } from '~/conf';
import { getUTC } from '~/utils/utils';



export default class AdminDubberMapRepositoryClass extends AdminRepository {
  constructor() {
    super();

    this.RepositoryName = 'AdminDubberMapRepository';
  }



  async create() {
    const slug = ADMIN_SLUG.DUBBERS_MAP;

    const exist = await this.safeGetOne({ slug });
    if (exist) throw new NekoError('sys:already_exist', `Admin document "${slug}" already exist`);

    const id = TestMode ? `~testing-${createNanoId()}` : createId();

    const payload: AdminDubbersMapType = {
      id,
      slug,
      created_at: getUTC().ISO,
      updated_at: getUTC().ISO,
      data: {},
    };

    const document = new this.model(payload);
    await document.save();

    Logger.info(`[${this.RepositoryName}]: New document has been created! [id: ${id}]`);
    this._doc = document;

    return DTOService.parse(payload);
  }



  setDubberSynonyms(id: string, synonyms: string[]) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this.set(`data.${id}`, synonyms);
  }
}
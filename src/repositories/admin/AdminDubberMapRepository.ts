import AdminRepository from './AdminRepository.js';
import DTS from '~/services/DataTransferService.js';
import Logger from '~/services/LoggerService.js';
import createId, { createNanoId } from '~/utils/create-id.js';
import { ADMIN_SLUG, AdminTeamsMapType, IAdminTeamMapData } from '~/schemas/entities/Admin.schema.js';
import { NekoError } from '~/services/ExceptionService.js';
import { TestMode } from '~/conf.js';
import { getUTC } from '~/utils/utils.js';



export default class AdminTeamMapRepositoryClass extends AdminRepository {
  constructor() {
    super();

    this.RepositoryName = 'AdminTeamMapRepository';
  }



  async create() {
    const slug = ADMIN_SLUG.TEAMS_MAP;

    const exist = await this.safeGetOne({ slug });
    if (exist) throw new NekoError('sys:already_exist', `Admin document "${slug}" already exist`);

    const id = TestMode ? `~testing-${createNanoId()}` : createId();

    const payload: AdminTeamsMapType = {
      id,
      slug,
      created_at: getUTC().ISO,
      updated_at: getUTC().ISO,
      data: [],
    };

    const document = new this.model(payload);
    await document.save();

    Logger.info(`[${this.RepositoryName}]: New document has been created! [id: ${id}]`);
    this._doc = document;

    return DTS.parse(payload);
  }



  setTeams(data: IAdminTeamMapData[]) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._set('data', data);
  }
}
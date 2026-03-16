import AdminRepository from './AdminRepository';
import DTOService from '~/service/DataTransferService';
import Logger from '~/service/LoggerService';
import createId, { createNanoId } from '~/utils/create-id';
import { ADMIN_SLUG, AdminTeamsMapType, IAdminTeamMapData } from '~/intf/IAdmin';
import { NekoError } from '~/service/ExceptionService';
import { TestMode } from '~/conf';
import { getUTC } from '~/utils/utils';



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

    return DTOService.parse(payload);
  }



  setTeams(data: IAdminTeamMapData[]) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this._set('data', data);
  }
}
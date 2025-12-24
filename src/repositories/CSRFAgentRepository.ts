import DocumentDTO from '~/service/DataTransferService';
import ICSRFAgent from '~/intf/ICSRFAgent';
import Logger from '~/service/LoggerService';
import UnifiedRepositoryClass from './UnifiedRepository';
import createId from '~/utils/create-id';
import crypto from 'crypto';
import mongoose, { Schema } from 'mongoose';
import { NekoError } from '~/service/ExceptionService';
import { RepositoryQueriesType } from '~/intf/types';
import { getUTC } from '~/utils/utils';


/** Repository type. Reffers to the model interface */
type RepositoryType = ICSRFAgent;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ id: query }, { origin: query }] };
};



const schema = new Schema<RepositoryType>({
  id: String,
  created_at: String,
  origin: String,
  public_key: String
}, { strict: false, versionKey: false });

const model = mongoose.model<RepositoryType>('csrf-agent', schema);



interface IConstructorProps {
  testmode?: boolean
}

interface ICreateProps {
  origin: string

  /** Save the document in the database. @default true */
  saveDocument?: boolean

  /** Must be removed after 3.0.0 */
  _implicitSetPKI?: string
  /** Must be removed after 3.0.0 */
  _implicitSetCreatedAt?: string

  /** @test is origin exist */
  _isOriginExist?: boolean
}

interface ICreate {
  document: ICSRFAgent
  privateKey: string
}



export class CSRFAgentRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  private testmode = false;

  constructor(props?: IConstructorProps) {
    super(model, queries);

    if (props?.testmode) this.testmode = props.testmode;
  }

  get document(): RepositoryType | null {
    return this._doc ? DocumentDTO.parse(this._doc) : null;
  }

  async save() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    await this.update();

    Logger.debug(`[CSRFAgent]: Document saved. [id: ${this._doc.id}; diff: ${this.diff.join('; ')}]`);
  }



  async create({ origin, saveDocument, _isOriginExist, _implicitSetCreatedAt, _implicitSetPKI }: ICreateProps): Promise<ICreate> {
    // Ensure that origin valid
    try {
      const url = new URL(`http://${origin}`);
      origin = url.hostname;
    } catch (e) {
      throw new NekoError(`sys:type_invalid`, `CSRF Agent origin must be valid URL domain`);
    }

    // Ensure that origin is unique
    let isOriginExist = false;

    if (this.testmode) {
      isOriginExist = Boolean(_isOriginExist);
    } else {
      const exist = await this.getOneByQuery({ origin });
      isOriginExist = Boolean(exist);
    }

    if (isOriginExist) throw new NekoError('sys:already_exist', `CSRF Agent with origin ${origin} already exist`);



    saveDocument = saveDocument ?? true;

    const { privateKey, publicKey } = this.generateKeypairs();

    const payload: ICSRFAgent = {
      id: createId(),
      created_at: _implicitSetCreatedAt ?? getUTC().ISO,
      origin,
      public_key: _implicitSetPKI ?? publicKey
    };

    const document = new model(payload);
    this._doc = document;

    if (saveDocument) await document.save();

    Logger.info(`[CSRFAgent]: New agent has been created! [id: ${payload.id}; origin: ${origin}]`);

    return { document: DocumentDTO.parse<ICSRFAgent>(document), privateKey };
  }



  /** 
   * Regenerate keypairs for agent
   * 
   * @returns privateKey
   */
  refreshKeys(): string {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const { privateKey, publicKey } = this.generateKeypairs();

    this.set('public_key', publicKey);

    Logger.debug(`[CSRFAgent]: New keypairs been issued for agent. [id: ${this._doc.id}]`);

    return privateKey;
  }




  private generateKeypairs() {
    return crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
  }
}



const CSRFAgentRepository = new CSRFAgentRepositoryClass();

export default CSRFAgentRepository;
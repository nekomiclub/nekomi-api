import TokenService, { TOKEN_METHOD } from './TokenService';
import conf from '~/config';
import createId from '~/utils/create-id';
import { ISessionToken } from '~/intf/IAuth';
import { IUserSession } from '~/intf/IUser';
import { NekoError } from './ExceptionService';
import { UserModel } from '~/repo/UserRepository';
import { getUTC } from '~/utils/utils';



interface IOpenSessionProps {
  is_limited?: boolean
}

interface IOpenSession {
  token: string
  session: IUserSession
}



export default class SessionService extends UserModel {
  /**
   * Open new session
   * 
   * @testing
   */
  async open(props?: IOpenSessionProps): Promise<IOpenSession> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    await this.revalidate();

    const sessionId = createId();

    const session: IUserSession = {
      id: sessionId,
      is_limited: props?.is_limited ?? true,
      expires_at: getUTC(getUTC().timestamp + conf.vars.SESSION_LIFETIME_MS).ISO,
      created_at: getUTC().ISO,
    };

    const token = TokenService.sign<ISessionToken>(TOKEN_METHOD.USER_SESSION_TOKEN, {
      user_id: this._doc.id,
      session_id: sessionId,
      created_at: getUTC().ISO
    });

    this.diff.push(`New session has been opened. [sessionId: ${sessionId}]`);

    this._doc.sessions.push(session);
    this._doc.markModified('sessions');

    return { token, session };
  }



  /**
   * Refresh session expiration
   * 
   * @testing
   */
  async refresh(id: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }



  /**
   * Logout session
   * 
   * @testing
   */
  async logout(targetId: string, currentId: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }



  /** 
   * Relavisate user sessions. Purge expired & disable new session limitation
   * 
   * @testing
   */
  async revalidate() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }
}
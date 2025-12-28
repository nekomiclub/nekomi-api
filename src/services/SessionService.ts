import DocumentDTO from './DataTransferService';
import IUser, { IUserSession } from '~/intf/IUser';
import TokenService, { TOKEN_METHOD } from './TokenService';
import conf from '~/config';
import createId from '~/utils/create-id';
import { ISessionToken } from '~/intf/IAuth';
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

interface IParseSession {
  user: IUser
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

    await this.revalidate();

    const currentSession = this._doc.sessions.find(el => el.id === currentId);
    if (!currentSession) throw new NekoError('auth:session_not_exist', `Session "${currentId}" is not exist`);

    // Reject if user try to remove not current session, while current session is limited
    if (targetId !== currentId && currentSession.is_limited) throw new NekoError('auth:session_limited');

    this._doc.sessions = this._doc.sessions.filter(el => el.id !== targetId);
    this._doc.markModified('sessions');

    this.diff.push(`Session logged out. [targetId: ${targetId}; currentId: ${currentId}]`);
  }



  /** 
   * Relavisate user sessions. Purge expired & disable new session limitation
   * 
   * @testing
   */
  async revalidate() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }



  /** 
   * Parse user session
   * Verify token & session existance
   * 
   * @testing
   */
  async parse(token: string): Promise<IParseSession> {
    const sessionData = TokenService.parse<ISessionToken>(token, TOKEN_METHOD.USER_SESSION_TOKEN);
    if (!sessionData.verified || !sessionData.payload.session_id) throw new NekoError('auth:token_invalid');

    await this.init({ id: sessionData.payload.user_id });
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const session = this._doc.sessions.find(el => el.id === sessionData.payload.session_id);
    if (!session) throw new NekoError('auth:session_not_exist', `Session "${sessionData.payload.session_id}" is not exist`);

    return { user: DocumentDTO.user(this._doc, true), session };
  }
}
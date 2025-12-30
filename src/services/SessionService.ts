import DTOService from './DataTransferService';
import IUser, { IUserSession } from '~/intf/IUser';
import Logger from './LoggerService';
import TokenService, { TOKEN_METHOD } from './TokenService';
import conf, { DevelopmentMode } from '~/config';
import createId from '~/utils/create-id';
import ms from 'ms';
import { ISODateString } from '~/intf/types';
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



const REVALIDATE_TIMEOUT = ms('30sec');



export default class SessionService extends UserModel {
  revalidatedAt: ISODateString | undefined;

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
   * @returns new session token
   * @testing
   */
  async refresh(id: string): Promise<string> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    await this.revalidate();

    const session = this._doc.sessions.find(el => el.id === id);
    if (!session) throw new NekoError('auth:session_not_exist', `Session "${id}" is not exist`);

    const newExpires = getUTC(getUTC().timestamp + conf.vars.SESSION_REFRESH_BY_MS).ISO;

    if (getUTC(newExpires).timestamp > getUTC(session.expires_at).timestamp) {
      session.expires_at = newExpires;

      this._doc.markModified(`sessions`);

      this.diff.push(`Session continued till ${newExpires}`);
    }



    return TokenService.sign<ISessionToken>(TOKEN_METHOD.USER_SESSION_TOKEN, {
      user_id: this._doc.id,
      session_id: session.id,
      created_at: getUTC().ISO
    });
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
   * Revalidate user sessions. Purge expired & disable session limitations
   * 
   * @testing
   */
  async revalidate() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Debounce revalidations
    if (this.revalidatedAt && getUTC(this.revalidatedAt).timestamp + REVALIDATE_TIMEOUT > getUTC().timestamp) return;

    const sessions: IUserSession[] = [];

    this.document?.sessions.forEach(el => {
      // Delete session if it has expired
      if (getUTC().timestamp > getUTC(el.expires_at).timestamp) {
        if (DevelopmentMode) Logger.debug(`[SessionService]: Session ${el.id} expired`);

        return;
      }

      // Disable limitations if session is not new 
      if (el.is_limited && getUTC().timestamp > getUTC(el.created_at).timestamp + conf.vars.SESSION_LIMITATION_TIMEOUT_MS) {
        if (DevelopmentMode) Logger.debug(`[SessionService]: Session ${el.id} limitation disabled`);

        el.is_limited = false;
      }

      sessions.push(el);
    });

    this._doc.sessions = sessions;
    this._doc.markModified('sessions');

    this.diff.push(`Sessions revalidated`);

    this.revalidatedAt = getUTC().ISO;
  }



  /** 
   * Parse user session
   * Verify token & session existance
   * 
   * @testing
   */
  async parse(token: string): Promise<IParseSession> {
    const sessionData = TokenService.parse<ISessionToken>(token, TOKEN_METHOD.USER_SESSION_TOKEN);
    if (!sessionData.payload.session_id || !sessionData.payload.user_id) throw new NekoError('auth:session_token_invalid');
    if (!sessionData.verified) throw new NekoError('auth:session_token_expired');

    await this.init({ id: sessionData.payload.user_id });
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    await this.revalidate();

    const session = this._doc.sessions.find(el => el.id === sessionData.payload.session_id);
    if (!session) throw new NekoError('auth:session_not_exist', `Session "${sessionData.payload.session_id}" is not exist`);

    return { user: DTOService.user(this._doc, true), session };
  }
}
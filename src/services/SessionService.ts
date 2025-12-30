import IUser, { IUserSession } from '~/intf/IUser';
import Logger from './LoggerService';
import TokenService, { TOKEN_METHOD } from './TokenService';
import conf, { DevelopmentMode } from '~/config';
import createId, { createNanoId } from '~/utils/create-id';
import ms from 'ms';
import { ISODateString } from '~/intf/types';
import { NekoError } from './ExceptionService';
import { SessionTokenSchema, SessionTokenType } from '~/intf/IAuth';
import { UserModel } from '~/repo/UserRepository';
import { calcISO, getUTC } from '~/utils/utils';



interface IOpenSessionProps {
  is_limited?: boolean
}

interface IOpenSession {
  token: string
  session: IUserSession
}

interface IParseSession {
  user: IUser
  sessionId: string
}



const REVALIDATE_TIMEOUT_MS = ms('30sec');



export default class SessionService extends UserModel {
  revalidatedAt: ISODateString | undefined;



  /**
   * Open new session
   * 
   * @autosave
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

    const token = TokenService.sign<SessionTokenType>(TOKEN_METHOD.USER_SESSION_TOKEN, {
      token_id: createNanoId(),
      user_id: this._doc.id,
      session_id: sessionId,
    });

    this.diff.push(`New session has been opened. [sessionId: ${sessionId}]`);

    this._doc.sessions.push(session);
    this._doc.markModified('sessions');

    await this.save();

    return { token, session };
  }



  /**
   * Refresh session expiration
   * 
   * @autosave
   * @returns new session token
   * @testing
   */
  async refresh(sessionId: string): Promise<string> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    await this.revalidate();

    const session = this._doc.sessions.find(el => el.id === sessionId);
    if (!session) throw new NekoError('auth:session_not_exist', `Session "${sessionId}" is not exist`);

    const newExpires = getUTC(getUTC().timestamp + conf.vars.SESSION_REFRESH_BY_MS).ISO;

    if (getUTC(newExpires).timestamp > getUTC(session.expires_at).timestamp) {
      session.expires_at = newExpires;

      this._doc.markModified(`sessions`);

      this.diff.push(`Session continued till ${newExpires}`);
    }

    await this.save();



    return TokenService.sign<SessionTokenType>(TOKEN_METHOD.USER_SESSION_TOKEN, {
      token_id: createNanoId(),
      user_id: this._doc.id,
      session_id: session.id
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
    if (this.revalidatedAt && calcISO(this.revalidatedAt, REVALIDATE_TIMEOUT_MS) > getUTC().timestamp) return;

    const sessions: IUserSession[] = [];

    this.document?.sessions.forEach(el => {
      // Delete session if it has expired
      if (getUTC().timestamp > calcISO(el.expires_at)) {
        if (DevelopmentMode) Logger.debug(`[SessionService (DEV)]: Session ${el.id} expired`);

        return;
      }

      // Delete session if max age reached
      if (getUTC().timestamp > calcISO(el.created_at, conf.vars.SESSION_COOKIE_MAX_AGE_MS)) {
        if (DevelopmentMode) Logger.debug(`[SessionService (DEV)]: Session ${el.id} max age reached`);

        return;
      }

      // Disable limitations if session is not new 
      if (el.is_limited && getUTC().timestamp > calcISO(el.created_at, conf.vars.SESSION_LIMITATION_TIMEOUT_MS)) {
        if (DevelopmentMode) Logger.debug(`[SessionService (DEV)]: Session ${el.id} limitation disabled`);

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
   * Ensure that token and session are valid
   * 
   * @testing
   */
  async parse(token: string): Promise<IParseSession> {
    const sessionData = TokenService.parse<SessionTokenType>(token, TOKEN_METHOD.USER_SESSION_TOKEN);
    if (!SessionTokenSchema.safeParse(sessionData).success || !sessionData.verified) throw new NekoError('auth:session_token_invalid');

    await this.init({ id: sessionData.payload.user_id });
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const sessionId = sessionData.payload.session_id;

    return {
      user: this.document!,
      sessionId
    };
  }
}
import CSRFAgentRepository from '~/repo/CSRFAgentRepository';
import TokenService from './TokenService';
import conf from '~/config';
import jwt from 'jsonwebtoken';
import { ICSRFToken, ISODateString } from '~/intf/types';
import { getUTC } from '~/utils/utils';



interface IAcceptedToken {
  token: string
  acceptedAt: ISODateString
}



/** Defines the time within token will be purged. Calculated as token.acceptedAt + PURGE_TIMEOUT */
const PURGE_TIMEOUT = 120000;

/** CSRF token lifespan */
const CSRF_TOKEN_LIFESPAN_MS = 5000;



class CSRFServiceClass {
  private tokens: IAcceptedToken[] = [];



  constructor() {
    setInterval(() => {
      this.purgeTokens();
    }, PURGE_TIMEOUT);
  }



  /** 
   * Verify token using it's origin
   */
  async verify(token: string, requestedOrigin: string): Promise<boolean> {
    this.pushToken(token);

    try {
      // Ensure that token is unique
      if (this.checkTokenUniqueness(token)) return false;

      const { origin } = TokenService.decode<ICSRFToken>(token).payload;

      // Ensure that requested origin match token origin
      if (requestedOrigin !== origin) return false;

      const agent = await CSRFAgentRepository.getOne(origin);

      return TokenService.verifySecret(token, agent.public_key);
    } catch (e) {
      return false;
    }
  }



  /** 
   * Sign CSRF token
   */
  signToken(): string {
    const payload: ICSRFToken = {
      origin: conf.domain
    };

    return jwt.sign(payload, conf.env.CSRF_Token, {
      algorithm: 'RS256',
      expiresIn: CSRF_TOKEN_LIFESPAN_MS / 1000,
      subject: 'CSRF'
    });
  }



  /** 
   * Check if token unique and not been stored
   */
  private checkTokenUniqueness(token: string): boolean {
    return this.tokens.some(el => el.token === token);
  }



  /** 
   * Push token to store
   */
  private pushToken(token: string) {
    this.purgeTokens();

    this.tokens.push({
      token,
      acceptedAt: getUTC().ISO
    });
  }



  /** 
   * Purge accepted tokens
   */
  private purgeTokens() {
    this.tokens = this.tokens.filter(el => getUTC(el.acceptedAt).timestamp + PURGE_TIMEOUT > getUTC().timestamp);
  }
}



const CSRFService = new CSRFServiceClass();

export default CSRFService;
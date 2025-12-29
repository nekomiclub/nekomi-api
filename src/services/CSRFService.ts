import CSRFAgentRepository from '~/repo/CSRFAgentRepository';
import TokenService from './TokenService';
import conf, { DevelopmentMode, TestMode } from '~/config';
import jwt from 'jsonwebtoken';
import { ICSRFToken, ISODateString } from '~/intf/types';
import { getUTC } from '~/utils/utils';



interface IAcceptedToken {
  token: string
  acceptedAt: ISODateString
}

interface IVerify {
  verified: boolean

  /** Will always be specified when verified is true */
  origin?: string
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
   * If requested origin provided, will match their similarity
   * 
   * @development you can pass "~dev" in development mode to use fresh api CSRF token
   */
  async verify(token: string, requestedOrigin?: string): Promise<IVerify> {
    if ((DevelopmentMode || TestMode) && token === '~dev') token = this.signToken(null);

    // Ensure that token is unique
    if (this.checkTokenUniqueness(token)) return { verified: false };
    this.pushToken(token);

    try {
      const { origin } = TokenService.decode<ICSRFToken>(token).payload;

      // Ensure that origin match requested if second was provided
      if (requestedOrigin && requestedOrigin !== origin) return { verified: false, origin };

      const agent = await CSRFAgentRepository.getOne(origin);

      return {
        verified: TokenService.verifySecret(token, agent.public_key),
        origin
      };
    } catch (e) {
      return { verified: false };
    }
  }



  /** 
   * Sign CSRF token
   */
  signToken(expiresIn?: number | null): string {
    const payload: ICSRFToken = {
      origin: conf.domains.NEKOMI_API_DOMAIN
    };

    return jwt.sign(payload, conf.env.CSRF_SK, {
      algorithm: 'RS256',
      expiresIn: expiresIn ?? CSRF_TOKEN_LIFESPAN_MS / 1000,
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
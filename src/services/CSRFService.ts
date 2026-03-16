import TokenService from './TokenService';
import conf, { DevelopmentMode, TestMode } from '~/conf';
import jwt from 'jsonwebtoken';
import { CSRFAgentRepositoryClass } from '~/repo/CSRFAgentRepository';
import { CSRFTokenType } from '~/schemas/auth.schema';
import { ISODateString } from '~/intf/BrandedIds';
import { calcISO, getUTC } from '~/utils/utils';
import { createNanoId } from '~/utils/create-id';



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
const PURGE_TIMEOUT_MS = conf.vars.CSRF_TOKEN_LIFETIME_MS * 2.5;



class CSRFServiceClass {
  private tokens: IAcceptedToken[] = [];



  constructor() {
    setInterval(() => {
      this.purgeTokens();
    }, PURGE_TIMEOUT_MS);
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
      const { origin } = TokenService.decode<CSRFTokenType>(token).payload;

      // Ensure that origin match requested if second was provided
      if (requestedOrigin && requestedOrigin !== origin) return { verified: false, origin };

      const agent = await new CSRFAgentRepositoryClass().getOne(origin);

      return {
        verified: TokenService.verifySecret(token, agent.public_key.replace(/\\n/g, '\n')),
        origin
      };
    } catch (e) {
      if (DevelopmentMode) console.error(`JWT token is not verified`, e);

      return { verified: false };
    }
  }



  /** 
   * Sign CSRF token
   */
  signToken(expiresIn?: number | null): string {
    const payload: CSRFTokenType = {
      token_id: createNanoId(),
      origin: conf.domains.NEKOMI_API_DOMAIN,
    };

    if (expiresIn === null) expiresIn = 3600;

    return jwt.sign(payload, conf.env.CSRF_SK, {
      algorithm: 'RS256',
      expiresIn: expiresIn ?? conf.vars.CSRF_TOKEN_LIFETIME_MS / 1000,
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
    this.tokens = this.tokens.filter(el => calcISO(el.acceptedAt, PURGE_TIMEOUT_MS) > getUTC().timestamp);
  }
}



const CSRFService = new CSRFServiceClass();

export default CSRFService;
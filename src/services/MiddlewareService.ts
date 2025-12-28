import CSRFService from './CSRFService';
import conf, { DevelopmentMode, TestMode } from '~/config';
import { HandleMiddleware, getCSRFToken } from '~/utils/http-utils';
import { NekoError } from './ExceptionService';



export type MiddlewareType = keyof MiddlewareService;



export default class MiddlewareService {
  async checkAccess() {

  }



  /**
   * Parse & verify CSRF token
   * If origins provided, will match token origin with allowed
   * 
   * @param token In development or test mode "~dev" value can be passed to use fresh nekomi-api token
   * @returns origin
   */
  async checkCSRF(token: string, origins: string[] = []): Promise<string> {
    token = (DevelopmentMode || TestMode) && token === '~dev' ? CSRFService.signToken(null) : token;

    const csrf = await CSRFService.verify(token);

    if (!csrf.verified) throw new NekoError('auth:csrf_invalid');

    // Pass verifying if origin is nekomi admin
    if (csrf.origin !== conf.domains.NEKOMI_ADMIN_DOMAIN) {
      if (origins.length !== 0 && !origins.includes(csrf.origin!)) throw new NekoError('auth:csrf_invalid', `Origin is not allowed`);
    }

    return csrf.origin!;
  }
}



class MiddlewareClass {
  private service = new MiddlewareService();



  /** Middleware wrapper for {@link MiddlewareService.checkAccess} */
  CheckAccess() {

  }



  /** Middleware wrapper for {@link MiddlewareService.checkCSRF} */
  CheckCSRF = (origins?: string[]) => HandleMiddleware(async (req) => {
    const token = getCSRFToken(req);

    const origin = await this.service.checkCSRF(token, origins);

    req._nekomi.middlewaresPassed?.push('checkCSRF');
    req._nekomi.csrfOrigin = origin;
  });
}



export const Middleware = new MiddlewareClass();
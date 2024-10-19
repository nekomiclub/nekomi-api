import { config } from '../../config';

const baseURL = config.URL.fullkekw_authority;

/** Base URL (http://example.com) included */
export const FK_AUTHORITY_ROUTES = {
  /** @method POST @returns IFK_AuthorityVerify */
  verify: `${baseURL}/verify`,
};

/** @prop FK_AUTHORITY_ROUTES.verify */
export interface IFK_AuthorityVerify {
  /** Token verification status */
  verified: boolean

  /** Token origin */
  origin: string
}
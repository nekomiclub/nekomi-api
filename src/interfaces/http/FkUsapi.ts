import { config } from '../../config';

const baseURL = config.URL.fullkekw_usapi;

/** Base URL (http://example.com) included */
export const FK_USAPI_ROUTES = {
  /** @method GET @param id @returns IFK_UsapiGetUser */
  get_user: (id: string) => `${baseURL}/user/${id}`,

  /** @method GET @returns IFK_UsapiAuthRefresh */
  refresh: `${baseURL}/auth/refresh`,
};

/** @prop FK_USAPI_ROUTES.get_user */
export interface IFK_UsapiGetUser {
  user: {
    /** FK-Usapi ID */
    id: string

    /** Username */
    username: string

    /** Email */
    email: string

    /** Avatar */
    avatarURL: string
  }
}

/** @prop FK_USAPI_ROUTES.refresh */
export interface IFK_UsapiAuthRefresh {
  /** FK-Usapi ID */
  id: string

  /** Username */
  username: string

  /** Avatar */
  avatar: string
}
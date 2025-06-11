import { E400, E401, E403, E500, ERROR } from './ErrorService';



// === BASE ===
export const ERROR_BASE_MIDDLEWARE_REQUIRED = new E500(`Request does not pass throught required middleware and being rejected`, ERROR.BASE_MIDDLEWARE_REQUIRED);
export const ERROR_BASE_MOCK_UNDEFINED = new E500(`Mock data was not passed into function`, ERROR.BASE_MOCK_UNDEFINED);
export const ERROR_BASE_NO_DOCUMENT = new E500(`HydratedDocument not passed into the Service contstructor`, ERROR.BASE_NO_DOCUMENT);
export const ERROR_BASE_FILE_TOO_LARGE = new E400(`Uploaded file size is too large`, ERROR.BASE_FILE_TOO_LARGE);



// === AUTH ===
export const ERROR_AUTH_SESSION_EXPIRED = new E401(`Your session has been expired. Re-login in fullkekw-sso`, ERROR.AUTH_SESSION_EXPIRED);
export const ERROR_AUTH_CSRF_INVALID = new E403(`CSRF token invalid`, ERROR.AUTH_CSRF_INVALID);



// === TOKEN SERVICE ===
export const ERROR_TOKEN_METHOD_INVALID = new E400(`Token method invalid`, ERROR.BASE_INVALID_PAYLOAD);
export const ERROR_TOKEN_DATATYPE_INVALID = new E400(`Token payload must be an object`, ERROR.BASE_INVALID_PAYLOAD);
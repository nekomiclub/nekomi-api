import { E400, E401, E403, E404, E500, ERROR } from './ErrorService';



// === BASE ===
export const ERROR_BASE_MIDDLEWARE_REQUIRED = new E500(`Request does not pass throught required middleware and being rejected`, ERROR.BASE_MIDDLEWARE_REQUIRED);
export const ERROR_BASE_MOCK_UNDEFINED = new E500(`Mock data was not passed into function`, ERROR.BASE_MOCK_UNDEFINED);
export const ERROR_BASE_NO_DOCUMENT = new E500(`HydratedDocument not passed into the Service contstructor`, ERROR.BASE_NO_DOCUMENT);
export const ERROR_BASE_FILE_TOO_LARGE = new E400(`Uploaded file size is too large`, ERROR.BASE_FILE_TOO_LARGE);




// === ROLE ===
export const ERROR_ROLE_NOT_FOUND = new E404(`Requested role is not found`, ERROR.ROLE_NOT_FOUND);



// === AUTH ===
export const ERROR_AUTH_SESSION_EXPIRED = new E401(`Your session was expire. Re-login at fullkekw-sso`, ERROR.AUTH_SESSION_EXPIRED);
export const ERROR_AUTH_CSRF_INVALID = new E403(`CSRF token is invalid`, ERROR.AUTH_CSRF_INVALID);



// === TOKEN SERVICE ===
export const ERROR_TOKEN_METHOD_INVALID = new E400(`Token method is invalid`, ERROR.BASE_INVALID_PAYLOAD);
export const ERROR_TOKEN_DATATYPE_INVALID = new E400(`Token payload must be an object`, ERROR.BASE_INVALID_PAYLOAD);



// === USER ===
export const ERROR_USER_USERNAME_INVALID = new E400(`Username is invalid`, ERROR.USER_USERNAME_INVALID);
export const ERROR_USER_USERNAME_OCCUPIED = new E401(`Username is already occupied`, ERROR.USER_USERNAME_INVALID);

export const ERROR_USER_LIB_NAME_INVALID = new E400(`Lib name is invalid`, ERROR.USER_LIB_NAME_INVALID);
export const ERROR_USER_LIB_NOT_FOUND = new E404(`User lib is not found`, ERROR.USER_LIB_NOT_FOUND);

export const ERROR_USER_TGTOKEN_ASSIGNED = new E401(`That telegram link token already assigned to some user`, ERROR.USER_TGTOKEN_ASSIGNED);
export const ERROR_USER_TGDATA_ID_MISS = new E500(`Cannot update user telegram data due to ID miss`, ERROR.USER_TGDATA_ID_MISS);
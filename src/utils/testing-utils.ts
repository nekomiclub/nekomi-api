import express from 'express';
import { ERROR_BASE_MOCK_UNDEFINED } from '~/services/Exceptions';
import { FullkekwAuthorityAPI_TokenVerify } from '~/core/interfaces/API/FullkekwAuthorityAPI.intf';
import { FullkekwUserAPI_Verify } from '~/core/interfaces/API/FullkekwUserAPI.intf';
import { config } from '~/config';



export enum MockID {
  CheckCSRF = 'CheckCSRF',
  CheckAccess = 'CheckAccess'
}

export interface Mock<T = any> {
  id: MockID
  payload: T
}



function createMock<T = any>(id: MockID, payload: T): Mock<T> {
  return { id, payload };
}

function getMock<T = any>(req: express.Request, id: MockID): T {
  let mocks: Mock[] = [];

  try {
    mocks = JSON.parse(req.header(config.vars.mockHeader)?.toString() ?? '[]');
  } catch (e) {
    console.error(e);
  }

  const mock = mocks.find(el => el.id === id);
  if (!mock) throw ERROR_BASE_MOCK_UNDEFINED;

  return mock.payload;
}



export const MockCheckCSRF = (payload: FullkekwAuthorityAPI_TokenVerify) => createMock(MockID.CheckCSRF, payload);
export const GetCheckCSRFMock = (req: express.Request) => getMock<FullkekwAuthorityAPI_TokenVerify>(req, MockID.CheckCSRF);

export const MockAccessCheck = (payload: FullkekwUserAPI_Verify) => createMock(MockID.CheckAccess, payload);
export const GetCheckAccessMock = (req: express.Request) => getMock<FullkekwUserAPI_Verify>(req, MockID.CheckAccess);



/** Fail test suite */
export const testfail = () => expect('FAIL TEST SUITE').toBeFalsy();

/** Pass test suite */
export const testpass = () => expect('PASS TEST SUITE').toBeTruthy();

/** Pass test only if passed function throws an error */
export async function shouldfail(func: () => Promise<void> | void) {
  try {
    await func();
    testfail();
  } catch (e) {
    testpass();
  }
}
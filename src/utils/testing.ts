import AnimeModel from '~/core/models/TitleModel';
import express from 'express';
import { E500 } from '~/services/ErrorService';
import { FullkekwAuthorityAPI_TokenVerify } from '~/core/interfaces/API/FullkekwAuthorityAPI.intf';
import { FullkekwUserAPI_Verify } from '~/core/interfaces/API/FullkekwUserAPI.intf';
import { Logger } from '~/services/LoggerService';
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
  if (!mock) throw new E500(`Mock with id (${id}) is not found`);

  return mock.payload;
}



export const MockCheckCSRF = (payload: FullkekwAuthorityAPI_TokenVerify) => createMock(MockID.CheckCSRF, payload);
export const GetCheckCSRFMock = (req: express.Request) => getMock(req, MockID.CheckCSRF);

export const MockAccessCheck = (payload: FullkekwUserAPI_Verify) => createMock(MockID.CheckAccess, payload);
export const GetCheckAccessMock = (req: express.Request) => getMock(req, MockID.CheckAccess);



export async function testPurge() {
  const purgeRegex = /~test/gi;

  await AnimeModel.deleteMany({ uuid: { $regex: purgeRegex } });

  Logger.info(`[Testing]: Testing documents were purged`);
}
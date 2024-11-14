import express from 'express';
import { AxiosError } from 'axios';
import { E500 } from '../services/ErrorService';
import { IMock, TMockID } from '../interfaces/Mocks';
import { config } from '../config';

/** Get mock data */
export function getMockData<T = any>(req: express.Request, id: TMockID): IMock<T> {
  let mocks: IMock[] = [];

  try {
    mocks = JSON.parse(req.header(config.vars.mockHeader)?.toString() || '[]');
  } catch (e) {
    console.error(e);
  }

  const mock = mocks.find(el => el.id === id);

  if (!mock) throw new E500(`Mock ${id} undefined`);

  if (mock.code > 400) {
    throw new AxiosError(undefined, `${mock.code}`);
  }

  return mock;
}
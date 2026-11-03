import request from 'supertest';
import { ErrorConstructor } from '~/service/ExceptionService.js';
import { app } from '../index.js';
import { expect } from 'vitest';



/** Fail test suite */
export const testfail = () => expect('FAIL TEST SUITE').toBeFalsy();

/** Pass test suite */
export const testpass = () => expect('PASS TEST SUITE').toBeTruthy();

/** Pass test only if passed function throws an error */
export async function shouldfail(func: () => Promise<void> | void, code?: string) {
  try {
    await func();
    testfail();
  } catch (e) {
    if (code !== undefined && e instanceof ErrorConstructor) {
      if (e.code === code) testpass();
      else throw new Error(`Invalid error code recieved: ${e.code} (expected: ${code})`);
    } else testpass();
  }
}



export async function shouldRejectAPIKey(url: string, method: 'get' | 'post' | 'put' | 'delete' | 'patch') {
  const res = await request(app)[method](url)
    .expect(401)
    .set(`X-API-Key`, `_INVALID`);

  expect(res.body.code).toBe(`auth:api_key_invalid`); // Error code must match provided
}



export function supertestCookieExist(headers: { [index: string]: string | string[] }, name: string): boolean {
  return (headers['set-cookie'] as string[])?.some(el => el.match(`${name}=.+;`));
}

export function supertestCookieRemoved(headers: { [index: string]: string | string[] }, name: string): boolean {
  return (headers['set-cookie'] as string[])?.some(el => el.match(`${name}=;`));
}
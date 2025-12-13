import { ErrorConstructor } from '~/service/ExceptionService';
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
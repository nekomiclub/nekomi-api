import { config } from '../config';
import { ERR_ACCESS_REJECTED, HTTPErrorConstructor } from '../services/ErrorService';
import { MiddlewareService } from '../services/MiddlewareService';
import { singCSRFToken } from '../services/TokenService';

describe('Middleware Service', () => {
  const instance = new MiddlewareService({ testMode: true });

  // describe('checkAccess', () => {

  // });

  describe('checkCSRF', () => {
    test('Pass - No required origin', async () => {
      expect(await instance.checkCSRF('_MOCKED', [], {
        origin: config.vars.domain,
        verified: true
      })).toBeTruthy();
    });

    test('Pass - Required origin specified', async () => {
      expect(await instance.checkCSRF('_MOCKED', [config.vars.domain], {
        origin: config.vars.domain,
        verified: true
      })).toBeTruthy();
    });

    test('Reject - Token not verified', async () => {
      try {
        await instance.checkCSRF('_MOCKED', [], {
          origin: '_INVALID',
          verified: false
        });
      } catch (e) {
        if (e instanceof ERR_ACCESS_REJECTED) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });

    test('Pass - Origin missmatch', async () => {
      try {
        await instance.checkCSRF('_MOCKED', [config.vars.domain], {
          origin: '_INVALID',
          verified: true
        });
      } catch (e) {
        if (e instanceof ERR_ACCESS_REJECTED) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });
  });
});
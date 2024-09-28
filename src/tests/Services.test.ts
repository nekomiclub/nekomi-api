import { config } from '../config';
import { MiddlewareService } from '../services/MiddlewareService';
import { singCSRFToken } from '../services/TokenService';

describe('Middleware Service', () => {
  const instance = new MiddlewareService({ testMode: true });

  describe('checkAccess', () => {

  });

  describe('checkCSRF', () => {
    test('Pass - No required origin', () => {
      expect(instance.checkCSRF('_MOCKED', [], {
        origin: config.vars.domain,
        verified: true
      })).toBeTruthy();
    });

    test('Pass - Required origin specified', () => {
      expect(instance.checkCSRF('_MOCKED', [config.vars.domain], {
        origin: config.vars.domain,
        verified: true
      })).toBeTruthy();
    });

    test('Reject - Token not verified', () => {
      expect(instance.checkCSRF('_MOCKED', [], {
        origin: config.vars.domain,
        verified: false
      })).toBeTruthy();
    });

    test('Pass - Origin missmatch', () => {
      expect(instance.checkCSRF('_MOCKED', [config.vars.domain], {
        origin: '_INVALID',
        verified: true
      })).toBeTruthy();
    });
  });
});
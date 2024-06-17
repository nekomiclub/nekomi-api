import ip from 'ip';
import request from 'supertest';
import { app } from '..';
import { IMockedData, config } from '../config';

const baseURL = `http://${ip.address()}`;

describe('Dev Controller', () => {
  //* This controller works only in Development mode

  // Routes
  const getAccessControl = `/dev/AccessControl`;
  const getCSRFCheck = `/dev/CSRFCheck`;



  describe(getAccessControl, () => {
    /*
      * Route checks AccessControl middleware
      * Route requires "dubber" user capability 
    */
  });

  describe(getCSRFCheck, () => {
    /*
      * Route checks CSRFCheck middleware
      * Route pass only api.animee.club domain
    */

    test('Pass', async () => {
      const mockedData: IMockedData[] = [
        {
          id: 'key_1',
          code: 200,
          data: {
            verified: true,
            origin: 'api.animee.club'
          }
        }
      ];

      await request(baseURL)
        .get(getCSRFCheck)
        .set(config.vars.csrfHeader, 'dummy')
        .set(config.vars.mockHeader, JSON.stringify(mockedData))
        .expect(200);
    });

    test('Reject - Token undefined', async () => {
      await request(baseURL)
        .get(getCSRFCheck)
        .expect(403);
    });

    test('Reject - Token invalid', async () => {
      const mockedData: IMockedData[] = [
        {
          id: 'key_1',
          code: 200,
          data: {
            verified: false,
            origin: 'api.animee.club'
          }
        }
      ];

      await request(baseURL)
        .get(getCSRFCheck)
        .set(config.vars.csrfHeader, 'dummy')
        .set(config.vars.mockHeader, JSON.stringify(mockedData))
        .expect(403);
    });

    test('Reject - Token missmatch', async () => {
      const mockedData: IMockedData[] = [
        {
          id: 'key_1',
          code: 200,
          data: {
            verified: true,
            origin: 'dummy'
          }
        }
      ];

      await request(baseURL)
        .get(getCSRFCheck)
        .set(config.vars.csrfHeader, 'dummy')
        .set(config.vars.mockHeader, JSON.stringify(mockedData))
        .expect(403);
    });
  });
});
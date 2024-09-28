// import { config } from '../config';
// import { MiddlewareService } from '../services/MiddlewareService';
// import { singCSRFToken } from '../services/TokenService';

// describe('Middleware Service', () => {
//   const instance = new MiddlewareService({ testMode: true });

//   // describe('checkAccess', () => {

//   // });

//   describe('checkCSRF', () => {
//     test('Pass - No required origin', async () => {
//       expect(await instance.checkCSRF('_MOCKED', [], {
//         origin: config.vars.domain,
//         verified: true
//       })).toBeTruthy();
//     });

//     test('Pass - Required origin specified', async () => {
//       expect(await instance.checkCSRF('_MOCKED', [config.vars.domain], {
//         origin: config.vars.domain,
//         verified: true
//       })).toBeTruthy();
//     });

//     test('Reject - Token not verified', async () => {
//       expect(await instance.checkCSRF('_MOCKED', [], {
//         origin: config.vars.domain,
//         verified: false
//       })).toBeTruthy();
//     });

//     test('Pass - Origin missmatch', async () => {
//       expect(await instance.checkCSRF('_MOCKED', [config.vars.domain], {
//         origin: '_INVALID',
//         verified: true
//       })).toBeTruthy();
//     });
//   });
// });
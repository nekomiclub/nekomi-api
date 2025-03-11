/**
 * @fileoverview CONTROLLER TESTS ARE DEPRECATED AND MUST BE REFACTORED INTO Router TESTS 
*/

it('deprecated', () => expect(true).toBeTruthy());




// import mongoose, { HydratedDocument } from 'mongoose';
// import request from 'supertest';

// import Title, { TitleService } from '~/models/Title';
// import UserModel, { UserService } from '~/models/User';
// import getUTC from '~/utils/get-utc';
// import { FullkekwUserAPI_TokenData } from '~/core/interfaces/API/FullkekwUserAPI.intf';
// import { IM_FkAuthorityVerify, IM_FkUsapiAuthRefresh, IMock } from '~/interfaces/types';
// import { INTERNALS, config } from '~/config';
// import { IUser } from '~/core/interfaces/UserIntf';
// import { NotifyService } from '~/services/NotifyService';
// import { createUUID } from '~/utils/create-id';


// beforeAll(() => {
//   const MONGO_URI = `mongodb://${INTERNALS.database.creds!.usr}:${INTERNALS.database.creds!.pwd}@${INTERNALS.database.host}:${INTERNALS.database.port}/${INTERNALS.database.creds!.name}`;

//   mongoose.set('strictQuery', false);
//   mongoose.connect(MONGO_URI, {
//     retryWrites: true,
//   });
// });

// afterAll(() => {
//   mongoose.disconnect();
// });

// const baseURL = config.URL.nekomi_core;

// describe('User controller', () => {
//   const TestID1 = 'test-controllers_user--1'; // Title matching for airing_started event
//   const TestUS1 = 'usercontroller1';
//   const TestUS1_newUsername = 'usercontrollernew1';

//   // Will be created
//   const TestID2 = 'test-controllers_user--2'; // Title not matching for airing_started event
//   const TestUS2 = 'usercontroller2';

//   const TestID3 = 'test-controllers_user--3';
//   const TestUS3 = 'usercontroller3';

//   let User: UserService;
//   let User3: UserService;

//   beforeAll(async () => {
//     await purge();

//     const user = await UserService.create({ id: TestID1, username: TestUS1 });
//     const user3 = await UserService.create({ id: TestID3, username: TestUS3 });

//     User = new UserService({ user });
//     User3 = new UserService({ user: user3 });

//     await TitleService.create({
//       id: TestID1,
//       year: getUTC().year,
//       status: 'announcement'
//     }, true);

//     await TitleService.create({
//       id: TestID2,
//       year: getUTC().year - 1,
//       status: 'out'
//     }, true);
//   });

//   afterAll(async () => {
//     await purge();
//   });

//   async function purge() {
//     await UserService.delete(TestID1, 'Test purge', 'many');
//     await UserService.delete(TestID2, 'Test purge', 'many');
//     await UserService.delete(TestID3, 'Test purge', 'many');

//     await Title.deleteMany({ id: TestID1 });
//     await Title.deleteMany({ id: TestID2 });
//   }

//   const CSRFMock: IMock<IM_FkAuthorityVerify> = {
//     id: 'FkAuthorityVerify',
//     code: 200,
//     data: {
//       origin: config.DOMAIN.nekomi,
//       verified: true
//     }
//   };

//   const ACMock: IMock<IM_FkUsapiAuthRefresh> = {
//     id: 'FkUsapiAuthRefresh',
//     code: 200,
//     data: {
//       avatar: '',
//       capabilities: ['basic'],
//       id: TestID1,
//       username: TestUS1_newUsername
//     }
//   };



//   describe('GET /user/validate', () => {
//     // Should refresh usapi session and sync usapi & nekomi user object
//     const usapiMock: IMock<FullkekwUserAPI_TokenData> = {
//       id: 'FkUsapiAuthRefresh',
//       code: 200,
//       data: {
//         avatar: 'http://example.com',
//         id: TestID1,
//         username: TestUS1_newUsername
//       }
//     };

//     test('200 - Session validated and synced', async () => {
//       await request(baseURL)
//         .get(`/user/validate`)
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set('Cookie', `${config.vars.sessionCookie}=_MOCKED`)
//         .set(config.vars.mockHeader, JSON.stringify([usapiMock, CSRFMock]))
//         .expect(200);

//       const user = await UserModel.findOne({ id: TestID1 });

//       expect(user?.username).toBe(TestUS1_newUsername);
//     });
//   });

//   describe('GET /user/:query', () => {
//     test('200 - User returned with private mode', async () => {
//       const res = await request(baseURL)
//         .get(`/user/${TestID1}`)
//         .expect(200);

//       expect(res.body.user.username).toBeTruthy();
//       expect(res.body.user.parsedLib).toBeUndefined(); // Parse lib not specified & not detailed mode
//       expect(res.body.user.libs).toBeUndefined(); // Not detailed mode
//     });

//     test('200 - User returned without private mode', async () => {
//       const res = await request(baseURL)
//         .get(`/user/${TestID1}?detailed=true`)
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set(config.vars.mockHeader, JSON.stringify([CSRFMock]))
//         .expect(200);

//       expect(res.body.user.libs).not.toBeUndefined(); // In detailed mode libs should be returned
//     });

//     test('200 - User parsed roles', async () => {
//       const res = await request(baseURL)
//         .get(`/user/${TestID1}?detailed=true&parseRoles=true`)
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set(config.vars.mockHeader, JSON.stringify([CSRFMock]))
//         .expect(200);

//       expect(res.body.parsedRoles).toBeTruthy(); // In detailed mode capabilities should be parsed
//     });

//     test('200 - User parsed lib', async () => {
//       const res = await request(baseURL)
//         .get(`/user/${TestID1}?detailed=true&parseLib=${User.user.libs[0].id}`)
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set(config.vars.mockHeader, JSON.stringify([CSRFMock]))
//         .expect(200);

//       expect(res.body.parsedLib).toBeTruthy(); // In detailed mode lib should be parsed
//     });

//     test('200 - Get user data by session', async () => {
//       const UsapiRefreshMock: IMock<FullkekwUserAPI_TokenData> = {
//         id: 'FkUsapiAuthRefresh',
//         code: 200,
//         data: {
//           avatar: '',
//           id: TestID1,
//           username: TestUS1_newUsername
//         },
//       };

//       const res = await request(baseURL)
//         .get(`/user/*`)
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set('Cookie', `${config.vars.sessionCookie}=_MOCKED`)
//         .set(config.vars.mockHeader, JSON.stringify([CSRFMock, UsapiRefreshMock]))
//         .expect(200);

//       expect(res.body.user.username).toBeTruthy();
//     });

//     test('404 - Can not get own data without session', async () => {
//       await request(baseURL)
//         .get(`/user/*`)
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set(config.vars.mockHeader, JSON.stringify([CSRFMock]))
//         .expect(404);
//     });

//     test('403 - Can not get private information with invalid csrf', async () => {
//       const CSRFMock: IMock<IM_FkAuthorityVerify> = {
//         id: 'FkAuthorityVerify',
//         code: 200,
//         data: {
//           origin: config.DOMAIN.nekomi,
//           verified: false
//         }
//       };

//       await request(baseURL)
//         .get(`/user/${TestID1}?detailed=true&parseRoles=true`)
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set(config.vars.mockHeader, JSON.stringify([CSRFMock]))
//         .expect(403);
//     });
//   });

//   describe('GET /user/linkTelegram/token', () => {
//     test('200 - Token issued', async () => {
//       let user = await UserModel.findOne({ id: TestID1 });

//       // Telegram must be not linked and token must be not issued
//       user!.statistics.isTelegramLinked = false;
//       expect(user!.telegramLinkToken).toBeNull();

//       user!.markModified('statistics');
//       await user!.save();

//       await request(baseURL)
//         .get('/user/linkTelegram/token')
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set('Cookie', `${config.vars.sessionCookie}=_MOCKED`)
//         .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
//         .expect(200);

//       user = await UserModel.findOne({ id: TestID1 });

//       expect(user!.telegramLinkToken).toBeTruthy(); // Telegram token must be issued
//     });

//     test('400 - Account already linked', async () => {
//       let user = await UserModel.findOne({ id: TestID1 });

//       // Telegram must be linked
//       user!.statistics.isTelegramLinked = true;

//       user!.markModified('statistics');
//       await user!.save();

//       await request(baseURL)
//         .get('/user/linkTelegram/token')
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set('Cookie', `${config.vars.sessionCookie}=_MOCKED`)
//         .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
//         .expect(400);
//     });
//   });

//   describe('POST /user/signin', () => {
//     test('200 - Login exist user', async () => {
//       const usapiMock: IMock<FullkekwUserAPI_TokenData> = {
//         id: 'FkUsapiAuthRefresh',
//         code: 200,
//         data: {
//           avatar: 'http://example.com',
//           id: TestID1,
//           username: TestUS1
//         }
//       };

//       await request(baseURL)
//         .post('/user/signin')
//         .send({
//           session: '_MOCKED'
//         })
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set(config.vars.mockHeader, JSON.stringify([usapiMock, CSRFMock]))
//         .expect(200);
//     });

//     test('201 - Create new account', async () => {
//       const usapiMock: IMock<FullkekwUserAPI_TokenData> = {
//         id: 'FkUsapiAuthRefresh',
//         code: 200,
//         data: {
//           avatar: 'http://example.com',
//           id: TestID2,
//           username: TestUS2
//         }
//       };

//       await request(baseURL)
//         .post('/user/signin')
//         .send({
//           session: '_MOCKED'
//         })
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set(config.vars.mockHeader, JSON.stringify([usapiMock, CSRFMock]))
//         .expect(201);
//     });
//   });



//   describe('POST /user/linkTelegram', () => {
//     const BotCSRF: IMock<IM_FkAuthorityVerify> = {
//       id: 'FkAuthorityVerify',
//       code: 200,
//       data: {
//         origin: config.DOMAIN.nekomi_bot,
//         verified: true
//       }
//     };

//     test('200 - Telegram linked', async () => {
//       const id = 21212121;

//       await request(baseURL)
//         .post('/user/linkTelegram')
//         .send({
//           animeeID: TestID3,
//           telegramID: id
//         })
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set(config.vars.mockHeader, JSON.stringify([BotCSRF]))
//         .expect(200);
//     });

//     test('400 - Telegram already linked', async () => {
//       const id = 12121212;
//       const user = await UserModel.findOne({ id: TestID1 });

//       // Make id exist
//       user!.telegramData = {
//         id
//       };

//       await user!.save();

//       await request(baseURL)
//         .post('/user/linkTelegram')
//         .send({
//           animeeID: TestID1,
//           telegramID: id
//         })
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set(config.vars.mockHeader, JSON.stringify([BotCSRF]))
//         .expect(400);
//     });
//   });

//   describe('POST /user/linkTelegram/verify', () => {
//     const BotCSRF: IMock<IM_FkAuthorityVerify> = {
//       id: 'FkAuthorityVerify',
//       code: 200,
//       data: {
//         origin: config.DOMAIN.nekomi_bot,
//         verified: true
//       }
//     };

//     test('200 - Token verified and revoked', async () => {
//       const token = 'mocked-usercontroller-1_telegramLinkToken';

//       // Set custom telegram link token
//       let user = await UserModel.findOne({ id: TestID3 });

//       user!.telegramLinkToken = token;
//       await user!.save();

//       const res = await request(baseURL)
//         .post('/user/linkTelegram/verify')
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set(config.vars.mockHeader, JSON.stringify([BotCSRF]))
//         .send({
//           token
//         })
//         .expect(200);

//       expect(res.body.id).toBe(TestID3);
//       // Token should be revoked
//       user = await UserModel.findOne({ id: TestID3 });
//       expect(user!.telegramLinkToken).toBeNull();
//     });

//     test('404 - Token invalid', async () => {
//       await request(baseURL)
//         .post('/user/linkTelegram/verify')
//         .send({
//           token: createUUID()
//         })
//         .set(config.vars.csrfHeader, '_MOCKED')
//         .set(config.vars.mockHeader, JSON.stringify([BotCSRF]))
//         .expect(404);
//     });
//   });



//   describe('PATCH /user', () => {
//     const ACMock: IMock<IM_FkUsapiAuthRefresh> = {
//       id: 'FkUsapiAuthRefresh',
//       code: 200,
//       data: {
//         avatar: '',
//         capabilities: ['basic'],
//         id: TestID3,
//         username: TestUS3
//       }
//     };

//     describe('editFolderItem', () => {
//       test('Add/remove title in/from lib', async () => {
//         const title = await Title.findOne();
//         const folderId = User3.user.libs.find(el => el.type === 'favorite')!.id;
//         const titleId = title!.id;

//         let user: HydratedDocument<IUser>;
//         let lib;
//         // Add title
//         await request(baseURL)
//           .patch('/user')
//           .set(config.vars.csrfHeader, '_MOCKED')
//           .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
//           .set('Cookie', `${config.vars.sessionCookie}=_MOCKED`)
//           .send({
//             method: 'editFolderItem',
//             folderId,
//             titleId
//           })
//           .expect(200);

//         user = (await UserModel.findOne({ id: TestID3 }))!;
//         lib = user.libs.find(el => el.id === folderId)!;

//         expect(lib.titles.includes(title!.id)).toBeTruthy();

//         // Remove
//         await request(baseURL)
//           .patch('/user')
//           .set(config.vars.csrfHeader, '_MOCKED')
//           .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
//           .set('Cookie', `${config.vars.sessionCookie}=_MOCKED`)
//           .send({
//             method: 'editFolderItem',
//             folderId,
//             titleId
//           })
//           .expect(200);

//         user = (await UserModel.findOne({ id: TestID3 }))!;
//         lib = user.libs.find(el => el.id === folderId)!;

//         expect(lib.titles.includes(title!.id)).toBeFalsy();
//       });

//       test('Edit plans with matching title for airing_started (add/remove title & subs)', async () => {
//         // Add airing_started if anime is announcement
//         const title = (await Title.findOne({ id: TestID1 }))!;
//         const folderId = User3.user.libs.find(el => el.type === 'plans')!.id;
//         const titleId = title.id;
//         const sub = NotifyService.createEvent({ event: 'airing_started', key: title.id });

//         let user: HydratedDocument<IUser>;

//         // Add
//         await request(baseURL)
//           .patch('/user')
//           .set(config.vars.csrfHeader, '_MOCKED')
//           .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
//           .set('Cookie', `${config.vars.sessionCookie}=_MOCKED`)
//           .send({
//             method: 'editFolderItem',
//             folderId,
//             titleId
//           })
//           .expect(200);

//         user = (await UserModel.findOne({ id: TestID3 }))!;

//         // Check if subscribe appended
//         expect(user.subscribes.find(el => el === sub)).toBeTruthy();

//         // Remove
//         await request(baseURL)
//           .patch('/user')
//           .set(config.vars.csrfHeader, '_MOCKED')
//           .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
//           .set('Cookie', `${config.vars.sessionCookie}=_MOCKED`)
//           .send({
//             method: 'editFolderItem',
//             folderId,
//             titleId
//           })
//           .expect(200);

//         user = (await UserModel.findOne({ id: TestID3 }))!;

//         // Check if subscribe appended
//         expect(user.subscribes.find(el => el === sub)).toBeFalsy();
//       });

//       test('Add not event matching title in plans', async () => {
//         const ACMock: IMock<IM_FkUsapiAuthRefresh> = {
//           id: 'FkUsapiAuthRefresh',
//           code: 200,
//           data: {
//             avatar: '',
//             capabilities: ['basic'],
//             id: TestID1,
//             username: TestUS1
//           }
//         };

//         // Add airing_started if anime is announcement
//         const title = (await Title.findOne({ id: TestID1 }))!;
//         const folderId = User.user.libs.find(el => el.type === 'plans')!.id;
//         const titleId = title!.id;
//         const sub = NotifyService.createEvent({ event: 'airing_started', key: title.id });

//         let user: HydratedDocument<IUser>;

//         // Add
//         await request(baseURL)
//           .patch('/user')
//           .set(config.vars.csrfHeader, '_MOCKED')
//           .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
//           .set('Cookie', `${config.vars.sessionCookie}=_MOCKED`)
//           .send({
//             method: 'editFolderItem',
//             folderId,
//             titleId
//           })
//           .expect(200);

//         user = (await UserModel.findOne({ id: TestID3 }))!;

//         // Check if subscribe appended
//         expect(user.subscribes.find(el => el === sub)).toBeFalsy();
//       });

//       test('Edit watching (add/remove title & subs)', async () => {
//         // Subscribe for new episodes
//         const title = (await Title.findOne())!;
//         const folderId = User3.user.libs.find(el => el.type === 'watching')!.id;
//         const titleId = title!.id;
//         const sub = NotifyService.createEvent({ event: 'new_episode', key: title.id });

//         let user: HydratedDocument<IUser>;

//         // Add
//         await request(baseURL)
//           .patch('/user')
//           .set(config.vars.csrfHeader, '_MOCKED')
//           .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
//           .set('Cookie', `${config.vars.sessionCookie}=_MOCKED`)
//           .send({
//             method: 'editFolderItem',
//             folderId,
//             titleId
//           })
//           .expect(200);

//         user = (await UserModel.findOne({ id: TestID3 }))!;

//         // Check if subscribe appended
//         expect(user.subscribes.find(el => el === sub)).toBeTruthy();

//         // Remove
//         await request(baseURL)
//           .patch('/user')
//           .set(config.vars.csrfHeader, '_MOCKED')
//           .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
//           .set('Cookie', `${config.vars.sessionCookie}=_MOCKED`)
//           .send({
//             method: 'editFolderItem',
//             folderId,
//             titleId
//           })
//           .expect(200);

//         user = (await UserModel.findOne({ id: TestID3 }))!;

//         // Check if subscribe appended
//         expect(user.subscribes.find(el => el === sub)).toBeFalsy();
//       });
//     });

//     test('patchWathProgress', async () => {

//     });
//   });
// });
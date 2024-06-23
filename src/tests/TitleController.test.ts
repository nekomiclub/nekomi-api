import ip from 'ip';
import request from 'supertest';
import mongoose from 'mongoose';
import * as cfg from '../config';

import User, { createUser } from '../Models/User';
import Title, { TitlePatcher, createTitle } from '../Models/Title';
import { ITitle, TAnimeGenre } from '../interfaces/Title';
import { IM_AccessControl, IM_CSRFCheck, IMock } from '../interfaces/Mocks';

const config = cfg.config;
const baseURL = `http://${ip.address()}`;

//* DB
beforeAll(() => {
  mongoose.set('strictQuery', false);

  mongoose.connect(`mongodb://${config.service.DB!.DEV.USR}:${config.service.DB!.DEV.PWD}@${config.db.HOST}:${config.db.PORT}/${config.service.DB!.DEV.DB_NAME}`, {
    retryWrites: true,
  }).catch(e => {
    console.error(e);
  });
});

afterAll(() => {
  mongoose.disconnect();
});



describe('TitleController', () => {
  /*
    Title controller tests

    * Namespaces
    * #1 - T1
    * #2 - T2
    * #3 - T3
    * #4 - T4, T41
  */



  describe('#1 GET /title/:query', () => {
    /*
      * Get title by ID or code
    */

    // Mock data
    const T1_ID = 'mocked-titleController-1';
    const T1_CODE = 'mocked-titleController-1_code';

    beforeAll(async () => {
      await purge();

      await createTitle('ROOT_TESTING', {
        id: T1_ID,
        code: T1_CODE
      });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await Title.deleteMany({ id: T1_ID });
    }



    test('T1 Pass - Get by ID', async () => {
      await request(baseURL)
        .get(`/title/${T1_ID}`)
        .expect(200);
    });

    test('T1 Pass - Get by code', async () => {
      await request(baseURL)
        .get(`/title/${T1_CODE}`)
        .expect(200);
    });

    test('Reject - Not found', async () => {
      await request(baseURL)
        .get(`/title/dummy_not_be_founded`)
        .expect(404);
    });
  });

  describe('#2 DELETE /title/:query', () => {
    /*
      * Delete title by ID
      * Required perms - titleDelete
      * Required CSRF - animee.club
    */

    // Mock data
    const T2_ID = 'mocked-titleController-2';

    const ACMock: IMock<IM_AccessControl> = {
      id: 'AccessControl',
      code: 200,
      data: {
        id: T2_ID,
      }
    };

    const CSRFMock: IMock<IM_CSRFCheck> = {
      id: 'CSRFCheck',
      code: 200,
      data: {
        verified: true,
        origin: 'animee.club'
      }
    };

    const mockedData = [ACMock, CSRFMock];

    beforeAll(async () => {
      await purge();

      await createTitle('ROOT_TESTING', {
        id: T2_ID,
      });

      await createUser({
        id: T2_ID,
        roles: ['user', 'editor'],
        avatar: '',
        username: T2_ID
      });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await Title.deleteMany({ id: T2_ID });

      await User.deleteMany({ id: T2_ID });
    }



    test('T2 Pass - Deleted', async () => {
      await request(baseURL)
        .delete(`/title/${T2_ID}`)
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify(mockedData))
        .expect(200);
    });

    test('T2 Reject - Not found', async () => {
      await request(baseURL)
        .delete(`/title/_INVALID`)
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify(mockedData))
        .expect(404);
    });

    test('T2 Reject - Perm missmatch', async () => {
      const ACMock: IMock<IM_AccessControl> = {
        id: 'AccessControl',
        code: 200,
        data: {
          id: T2_ID,
          capabilities: ['root']
        }
      };

      await request(baseURL)
        .delete(`/title/_INVALID`)
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([ACMock, CSRFMock]))
        .expect(403);
    });

    test('T2 Reject - CSRF missmatch', async () => {
      const CSRFMock: IMock<IM_CSRFCheck> = {
        id: 'CSRFCheck',
        code: 200,
        data: {
          verified: true,
          origin: '_INVALID'
        }
      };

      await request(baseURL)
        .delete(`/title/_INVALID`)
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([ACMock, CSRFMock]))
        .expect(403);
    });
  });

  describe('#3 POST /title', () => {
    /*
      * Create title
    */

    // Mock data
    const T3_ID = 'mocked-titleController-3';

    const ACMock: IMock<IM_AccessControl> = {
      id: 'AccessControl',
      code: 200,
      data: {
        id: T3_ID,
      }
    };

    const CSRFMock: IMock<IM_CSRFCheck> = {
      id: 'CSRFCheck',
      code: 200,
      data: {
        verified: true,
        origin: 'animee.club'
      }
    };

    const mockedData = [ACMock, CSRFMock];

    beforeAll(async () => {
      await purge();

      await createUser({
        id: T3_ID,
        roles: ['user', 'editor'],
        avatar: '',
        username: T3_ID
      });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await User.deleteMany({ id: T3_ID });
      await Title.deleteMany({ id: T3_ID });
    }



    test('T3 Pass - Title created', async () => {
      const res = await request(baseURL)
        .post(`/title`)
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify(mockedData))
        .expect(201);

      await Title.deleteOne({ id: res.body.id });
    });

    test('T3 Reject - Perm missmatch', async () => {
      const ACMock: IMock<IM_AccessControl> = {
        id: 'AccessControl',
        code: 200,
        data: {
          id: T3_ID,
          capabilities: ['root']
        }
      };

      await request(baseURL)
        .post(`/title`)
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([ACMock, CSRFMock]))
        .expect(403);
    });

    test('T3 Reject - CSRF missmatch', async () => {
      const CSRFMock: IMock<IM_CSRFCheck> = {
        id: 'CSRFCheck',
        code: 200,
        data: {
          origin: 'animee.club',
          verified: false
        }
      };

      await request(baseURL)
        .post(`/title`)
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([ACMock, CSRFMock]))
        .expect(403);
    });
  });

  describe('#4 PATCH /title/:id', () => {
    /*
      * Patch title fields
    */

    // Mock data
    const T4_ID = 'mocked-titleController-4'; // Root
    const T41_ID = 'mocked-titleController-5'; // User (AC should pass, but execWithPerm should reject)

    const ACMock: IMock<IM_AccessControl> = {
      id: 'AccessControl',
      code: 200,
      data: {
        id: T4_ID,
      }
    };

    const CSRFMock: IMock<IM_CSRFCheck> = {
      id: 'CSRFCheck',
      code: 200,
      data: {
        verified: true,
        origin: 'animee.club'
      }
    };

    const mockedData = [ACMock, CSRFMock];

    beforeAll(async () => {
      await purge();

      await createTitle('ROOT_TESTING', {
        id: T4_ID,
        episodes: [{
          dubberID: T4_ID,
          frames: [],
          order: 12,
          qualities: {
            q1080: 'sth'
          }
        }]
      });

      await createUser({
        id: T4_ID,
        roles: ['root'],
        avatar: '',
        username: T4_ID
      });

      await createUser({
        id: T41_ID,
        roles: ['user'],
        avatar: '',
        username: T41_ID
      });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await User.deleteMany({ id: T4_ID });
      await User.deleteMany({ id: T41_ID });
      await Title.deleteMany({ id: T4_ID });
    }



    // Test one of proxied properties
    describe('setDescription', () => {
      test('Pass', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            setDescription: 'Description'
          })
          .expect(200);
      });

      test('Reject - Perm missmatch', async () => {
        const ACMock: IMock<IM_AccessControl> = {
          id: 'AccessControl',
          code: 200,
          data: {
            id: T41_ID,
          }
        };

        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([ACMock, CSRFMock]))
          .send({
            setYear: 2024
          })
          .expect(403);
      });
    });



    // Must verify that value is not NaN
    describe('setYear', () => {
      test('Pass', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            setYear: 2024
          })
          .expect(200);
      });

      test('Reject - Value is NaN', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            setYear: '_INVALID'
          })
          .expect(400);
      });

      test('Reject - Perm missmatch', async () => {
        const ACMock: IMock<IM_AccessControl> = {
          id: 'AccessControl',
          code: 200,
          data: {
            id: T41_ID,
          }
        };

        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([ACMock, CSRFMock]))
          .send({
            setYear: 2024
          })
          .expect(403);
      });
    });

    describe('setRating', () => {
      test('Pass', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            setRating: 8
          })
          .expect(200);
      });

      test('Reject - Value is NaN', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            setRating: '_INVALID'
          })
          .expect(400);
      });

      test('Reject - Perm missmatch', async () => {
        const ACMock: IMock<IM_AccessControl> = {
          id: 'AccessControl',
          code: 200,
          data: {
            id: T41_ID,
          }
        };

        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([ACMock, CSRFMock]))
          .send({
            setRating: 8
          })
          .expect(403);
      });
    });

    describe('setEps', () => {
      test('Pass', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            setEps: 12
          })
          .expect(200);
      });

      test('Reject - Value is NaN', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            setEps: '_INVALID'
          })
          .expect(400);
      });

      test('Reject - Perm missmatch', async () => {
        const ACMock: IMock<IM_AccessControl> = {
          id: 'AccessControl',
          code: 200,
          data: {
            id: T41_ID,
          }
        };

        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([ACMock, CSRFMock]))
          .send({
            setEps: 12
          })
          .expect(403);
      });
    });

    describe('editEpMeta', () => {
      test('Pass', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            editEpMeta: {
              action: 'edit',
              order: 12,
              dateOut: 2000,
              names: {
                ukr: 'meta',
                eng: 'meta'
              }
            }
          })
          .expect(200);
      });

      test('Reject - Value is NaN', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            editEpMeta: {
              action: 'edit',
              order: 'f12',
              dateOut: 'f2000',
              names: {
                ukr: 'meta',
                eng: 'meta'
              }
            }
          })
          .expect(400);
      });

      test('Reject - Perm missmatch', async () => {
        const ACMock: IMock<IM_AccessControl> = {
          id: 'AccessControl',
          code: 200,
          data: {
            id: T41_ID,
          }
        };

        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([ACMock, CSRFMock]))
          .send({
            editEpMeta: {
              action: 'edit',
              order: 12,
              dateOut: 2000,
              names: {
                ukr: 'meta',
                eng: 'meta'
              }
            }
          })
          .expect(403);
      });
    });

    describe('deleteEpisode', () => {
      test('Pass', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            deleteEpisode: {
              dubID: T4_ID,
              episodeOrder: 12
            }
          })
          .expect(200);
      });

      test('Reject - Value is NaN', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            deleteEpisode: {
              dubID: T4_ID,
              episodeOrder: 'f12'
            }
          })
          .expect(400);
      });

      test('Reject - Perm missmatch', async () => {
        const ACMock: IMock<IM_AccessControl> = {
          id: 'AccessControl',
          code: 200,
          data: {
            id: T41_ID,
          }
        };

        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([ACMock, CSRFMock]))
          .send({
            deleteEpisode: {
              dubID: T4_ID,
              episodeOrder: 12
            }
          })
          .expect(403);
      });
    });



    // Must verify that value is an array
    describe('changeNames', () => {
      test('Pass', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            changeNames: {
              alt: ['sth']
            }
          })
          .expect(200);
      });

      test('Reject - Value is not an array', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            changeNames: {
              alt: 'sth'
            }
          })
          .expect(400);
      });

      test('Reject - Perm missmatch', async () => {
        const ACMock: IMock<IM_AccessControl> = {
          id: 'AccessControl',
          code: 200,
          data: {
            id: T41_ID,
          }
        };

        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([ACMock, CSRFMock]))
          .send({
            changeNames: {
              alt: ['sth']
            }
          })
          .expect(403);
      });
    });

    describe('setStudios', () => {
      test('Pass', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            setStudios: ['sth']
          })
          .expect(200);
      });

      test('Reject - Value is not an array', async () => {
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify(mockedData))
          .send({
            setStudios: 'sth'
          })
          .expect(400);
      });

      test('Reject - Perm missmatch', async () => {
        const ACMock: IMock<IM_AccessControl> = {
          id: 'AccessControl',
          code: 200,
          data: {
            id: T41_ID,
          }
        };
        await request(baseURL)
          .patch(`/title/${T4_ID}`)
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([ACMock, CSRFMock]))
          .send({
            setStudios: ['sth']
          })
          .expect(403);
      });
    });
  });
});

describe('Title Model', () => {
  describe('TitlePatcher', () => {
    const T1_ID = 'mocked-titleModel-1';
    let Patcher: TitlePatcher | null = null;

    beforeAll(async () => {
      await purge();

      await createTitle('ROOT_TESTING', {
        id: T1_ID,
        // Mocked for deleteEpisode test
        episodes: [{
          dubberID: T1_ID,
          frames: [],
          order: 1212,
          qualities: {
            q1080: 'sth'
          }
        }]
      });

      const title = await Title.findOne({ id: T1_ID });
      Patcher = new TitlePatcher(title!, { testMode: true });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await Title.deleteMany({ id: T1_ID });
    }

    describe('changeNames', () => {
      test('Pass', () => {
        Patcher?.changeNames({
          alt: ['VALID', '    VALID       NAME'],
          eng: '  VALID       NAME  ',
          ukr: 'VALID_NAME'
        });

        const title = Patcher?.getTitle();

        expect(title?.names.eng).toEqual('VALID NAME');
        expect(title?.code).toEqual('valid-name');

        expect(title?.names.ukr).toEqual('VALID_NAME');
        expect(title?.names.alt).toEqual(['VALID', 'VALID NAME']);
      });

      test('Reject - Max length reached', () => {
        try {
          Patcher?.changeNames({
            eng: MAX_LENGTH_TEXT
          });

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });

      test('Reject - Max alt names reached', () => {
        try {
          Patcher?.changeNames({
            alt: MAX_LENGTH_ARR,
          });

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });
    });

    describe('changeDescription', () => {
      test('Pass', () => {
        Patcher?.changeDescription('  NEW     DESCRIPTION     ');

        const title = Patcher?.getTitle();

        expect(title?.description).toEqual('NEW DESCRIPTION');
      });

      test('Reject', () => {
        try {
          Patcher?.changeDescription(MAX_LENGTH_TEXT);

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });
    });

    describe('changeDetails', () => {
      test('Pass', () => {
        Patcher?.changeDetails('  NEW     DETAILS     ');

        const title = Patcher?.getTitle();

        expect(title?.details).toEqual('NEW DETAILS');
      });

      test('Reject', () => {
        try {
          Patcher?.changeDetails(MAX_LENGTH_TEXT);

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });
    });

    describe('changeEpisodesCount', () => {
      test('Pass', () => {
        Patcher?.changeEpisodesCount(10);

        const title = Patcher?.getTitle();

        expect(title?.episodesCount).toEqual(10);
      });

      test('Pass - Set null', () => {
        Patcher?.changeEpisodesCount(0);

        const title = Patcher?.getTitle();

        expect(title?.episodesCount).toEqual(null);
      });

      test('Reject - Below min', () => {
        try {
          Patcher?.changeEpisodesCount(-1);

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });

      test('Reject - Above max', () => {
        try {
          Patcher?.changeEpisodesCount(10000);

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });
    });

    describe('changeGenres', () => {
      test('Pass', () => {
        Patcher?.changeGenres(['3D']);

        const title = Patcher?.getTitle();

        expect(title?.genres).toEqual(['3D']);
      });

      test('Reject', () => {
        try {
          Patcher?.changeGenres(MAX_LENGTH_ARR as TAnimeGenre[]);

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });
    });

    describe('changeRating', () => {
      test('Pass', () => {
        Patcher?.changeRating(5, 'Animee');

        const title = Patcher?.getTitle();

        expect(title?.rating.Animee).toEqual(5);
      });

      test('Pass - Set null', () => {
        Patcher?.changeRating(0, 'Animee');

        const title = Patcher?.getTitle();

        expect(title?.rating.Animee).toEqual(null);
      });

      test('Reject', () => {
        try {
          Patcher?.changeRating(20, 'Animee');

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });
    });

    describe('changeYear', () => {
      test('Pass', () => {
        Patcher?.changeYear(2024);

        const title = Patcher?.getTitle();

        expect(title?.year).toEqual(2024);
      });

      test('Reject - Year below max', () => {
        try {
          Patcher?.changeYear(1990);

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });

      test('Reject - Year above max', () => {
        try {
          Patcher?.changeYear(2040);

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });
    });

    describe('changeStudios', () => {
      test('Pass', () => {
        Patcher?.changeStudios(['Fullkekw', 'Animee']);

        const title = Patcher?.getTitle();

        expect(title?.studios).toEqual(['Fullkekw', 'Animee']);
      });

      test('Reject - Studio length above max', () => {
        try {
          Patcher?.changeStudios(['looooooooooooooooooooooooooooooooooooong']);

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });

      test('Reject - Studios maximum count reached', () => {
        try {
          Patcher?.changeStudios(MAX_LENGTH_ARR);

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });
    });

    describe('changeEpisodeMeta', () => {
      const order = 1212;

      test('Pass - Meta added', () => {
        Patcher?.changeEpisodeMeta({
          action: 'edit',
          dateOut: 2000,
          names: {
            eng: 'NEW_ENG',
            ukr: '  NEW   UKR  ',
          },
          order
        });

        const title = Patcher?.getTitle();
        const meta = title?.episodesMeta.find(el => el.order === order);

        expect(meta?.names.eng).toEqual('NEW_ENG');
        expect(meta?.names.ukr).toEqual('NEW UKR');
      });

      test('Pass - Meta edited', () => {
        Patcher?.changeEpisodeMeta({
          action: 'edit',
          dateOut: 2000,
          names: {
            eng: 'EDITED_ENG',
            ukr: '  EDITED   UKR  ',
          },
          order
        });

        const title = Patcher?.getTitle();
        const meta = title?.episodesMeta.find(el => el.order === order);

        expect(meta?.names.eng).toEqual('EDITED_ENG');
        expect(meta?.names.ukr).toEqual('EDITED UKR');
      });

      test('Pass - Meta deleted', () => {
        Patcher?.changeEpisodeMeta({
          action: 'delete',
          dateOut: 2000,
          names: {
            eng: '_PASS',
            ukr: '_PASS',
          },
          order
        });

        const title = Patcher?.getTitle();
        const meta = title?.episodesMeta.find(el => el.order === order);

        expect(meta).toBeUndefined();
      });

      test('Reject - Can not delete not exist meta', () => {
        try {
          Patcher?.changeEpisodeMeta({
            action: 'delete',
            dateOut: 2000,
            names: {
              eng: '',
              ukr: '',
            },
            order: -1
          });

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });

      test('Reject - Can not create meta for 10000 episode ', () => {
        try {
          Patcher?.changeEpisodeMeta({
            action: 'edit',
            dateOut: 2000,
            names: {
              eng: '',
              ukr: '',
            },
            order: 10000
          });

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });
    });

    describe('deleteEpisode', () => {
      test('Pass', async () => {
        await Patcher?.deleteEpisode('ROOT_TESTING', {
          dubID: T1_ID,
          order: 1212,
        });

        const title = Patcher?.getTitle();
        const ep = title?.episodes.find(el => el.order === 1212 && el.dubberID === T1_ID);

        expect(ep).toBeUndefined();
      });

      test('Reject - Episode not exist', async () => {
        try {
          await Patcher?.deleteEpisode('ROOT_TESTING', {
            dubID: T1_ID,
            order: -1
          });

          expect(false).toBeTruthy();
        } catch (e) {
          expect(true).toBeTruthy();
        }
      });
    });
  });
});


// try {
//   expect(false).toBeTruthy();
// } catch (e) {
//   expect(true).toBeTruthy();
// }





const MAX_LENGTH_ARR = ['NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME', 'NAME'];

const MAX_LENGTH_TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Placerat orci nulla pellentesque dignissim enim sit amet venenatis urna. Fermentum iaculis eu non diam. Id faucibus nisl tincidunt eget nullam non. In vitae turpis massa sed elementum. Enim ut tellus elementum sagittis vitae et. Et malesuada fames ac turpis egestas integer. Tincidunt dui ut ornare lectus sit amet est. Diam donec adipiscing tristique risus nec feugiat in fermentum posuere. Pellentesque elit eget gravida cum sociis. Fermentum leo vel orci porta non pulvinar neque. Velit euismod in pellentesque massa. Sodales neque sodales ut etiam sit. Enim eu turpis egestas pretium aenean pharetra. Mi eget mauris pharetra et ultrices neque. Neque laoreet suspendisse interdum consectetur. Magna sit amet purus gravida quis blandit turpis. Aliquam ultrices sagittis orci a scelerisque purus semper eget duis. Aliquam etiam erat velit scelerisque in. At elementum eu facilisis sed odio. Porttitor rhoncus dolor purus non enim praesent elementum. Id diam maecenas ultricies mi. Ante metus dictum at tempor commodo ullamcorper a lacus. In massa tempor nec feugiat. Gravida neque convallis a cras semper.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Placerat orci nulla pellentesque dignissim enim sit amet venenatis urna. Fermentum iaculis eu non diam. Id faucibus nisl tincidunt eget nullam non. In vitae turpis massa sed elementum. Enim ut tellus elementum sagittis vitae et. Et malesuada fames ac turpis egestas integer. Tincidunt dui ut ornare lectus sit amet est. Diam donec adipiscing tristique risus nec feugiat in fermentum posuere. Pellentesque elit eget gravida cum sociis. Fermentum leo vel orci porta non pulvinar neque. Velit euismod in pellentesque massa. Sodales neque sodales ut etiam sit. Enim eu turpis egestas pretium aenean pharetra. Mi eget mauris pharetra et ultrices neque. Neque laoreet suspendisse interdum consectetur. Magna sit amet purus gravida quis blandit turpis. Aliquam ultrices sagittis orci a scelerisque purus semper eget duis. Aliquam etiam erat velit scelerisque in. At elementum eu facilisis sed odio. Porttitor rhoncus dolor purus non enim praesent elementum. Id diam maecenas ultricies mi. Ante metus dictum at tempor commodo ullamcorper a lacus. In massa tempor nec feugiat. Gravida neque convallis a cras semper.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Placerat orci nulla pellentesque dignissim enim sit amet venenatis urna. Fermentum iaculis eu non diam. Id faucibus nisl tincidunt eget nullam non. In vitae turpis massa sed elementum. Enim ut tellus elementum sagittis vitae et. Et malesuada fames ac turpis egestas integer. Tincidunt dui ut ornare lectus sit amet est. Diam donec adipiscing tristique risus nec feugiat in fermentum posuere. Pellentesque elit eget gravida cum sociis. Fermentum leo vel orci porta non pulvinar neque. Velit euismod in pellentesque massa. Sodales neque sodales ut etiam sit. Enim eu turpis egestas pretium aenean pharetra. Mi eget mauris pharetra et ultrices neque. Neque laoreet suspendisse interdum consectetur. Magna sit amet purus gravida quis blandit turpis. Aliquam ultrices sagittis orci a scelerisque purus semper eget duis. Aliquam etiam erat velit scelerisque in. At elementum eu facilisis sed odio. Porttitor rhoncus dolor purus non enim praesent elementum. Id diam maecenas ultricies mi. Ante metus dictum at tempor commodo ullamcorper a lacus. In massa tempor nec feugiat. Gravida neque convallis a cras semper.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Placerat orci nulla pellentesque dignissim enim sit amet venenatis urna. Fermentum iaculis eu non diam. Id faucibus nisl tincidunt eget nullam non. In vitae turpis massa sed elementum. Enim ut tellus elementum sagittis vitae et. Et malesuada fames ac turpis egestas integer. Tincidunt dui ut ornare lectus sit amet est. Diam donec adipiscing tristique risus nec feugiat in fermentum posuere. Pellentesque elit eget gravida cum sociis. Fermentum leo vel orci porta non pulvinar neque. Velit euismod in pellentesque massa. Sodales neque sodales ut etiam sit. Enim eu turpis egestas pretium aenean pharetra. Mi eget mauris pharetra et ultrices neque. Neque laoreet suspendisse interdum consectetur. Magna sit amet purus gravida quis blandit turpis. Aliquam ultrices sagittis orci a scelerisque purus semper eget duis. Aliquam etiam erat velit scelerisque in. At elementum eu facilisis sed odio. Porttitor rhoncus dolor purus non enim praesent elementum. Id diam maecenas ultricies mi. Ante metus dictum at tempor commodo ullamcorper a lacus. In massa tempor nec feugiat. Gravida neque convallis a cras semper.`;
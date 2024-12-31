import mongoose from 'mongoose';

import DubberModel, { DubberService } from '../../../Models/Dubber';
import UserModel, { UserService } from '../../../Models/User';
import { ERR_ACCESS_REJECTED, ERR_ALREADY_EXIST, ERR_INVALID_PAYLOAD, ERR_LENGTH_INVALID, ERR_TYPE_INVALID } from '../../../services/ErrorService';
import { INTERNALS, config } from '../../../config';
import { ITitleEpisodeMeta, TAnimeGenre } from '../../../interfaces/Title';
import { Readable } from 'stream';
import { TitleService } from '../../../Models/Title';
import { getUTC } from '../../../handlers/handler';



beforeAll(() => {
  const MONGO_URI = `mongodb://${INTERNALS.database.creds!.usr}:${INTERNALS.database.creds!.pwd}@${INTERNALS.database.host}:${INTERNALS.database.port}/${INTERNALS.database.creds!.name}`;

  mongoose.set('strictQuery', false);
  mongoose.connect(MONGO_URI, {
    retryWrites: true,
  });
});

afterAll(() => {
  mongoose.disconnect();
});



describe('Title Model', () => {
  let Title: TitleService;

  const TestID1 = 'test-models_title--T1';
  const TestID2 = 'test-models_title--T2'; // Title will be created

  beforeAll(async () => {
    await purge();

    const title = await TitleService.create({
      id: TestID1
    }, true);

    await UserService.create({
      id: TestID1,
      username: 'testmodelstitle1'
    });

    await DubberService.create({
      id: TestID1,
      nameEng: 'testmodelsdubber1',
      nameUkr: 'test dubber 1',
    });

    Title = new TitleService({ title, testMode: true });
  });

  afterAll(async () => {
    await purge();
  });

  async function purge() {
    await TitleService.delete(TestID1, 'Test purge', 'many');
    await TitleService.delete(TestID2, 'Test purge', 'many');
    await UserService.delete(TestID1, 'Test purge', 'many');
    await DubberService.delete(TestID1, 'Test purge', 'many');
  }



  describe('create', () => {

  });

  // Delete already tested in purge function

  //* Patch
  describe('patchNames', () => {
    test('Pass - Names changed', async () => {
      const engName = 'yoma rthw';
      const ukrName = 'назва топова';
      const ukrNameObfuscated = '  назва      топова     ';
      const altNames = ['hello', 'world', 'whats up'];
      const altNamesObfuscated = ['hello', '    world', '    whats      up    '];

      await Title.patchNames({
        eng: engName,
        ukr: ukrNameObfuscated,
        alt: altNamesObfuscated
      });

      expect(Title.title.names.eng).toBe(engName);
      expect(Title.title.code).toBe(engName.replaceAll(' ', '-')); // Changing english name must change code also
      expect(Title.title.names.ukr).toBe(ukrName);
      expect(Title.title.names.alt).toStrictEqual(altNames);
    });

    test('Reject - Length missmatch', async () => {
      // Greater than max
      try {
        await Title.patchNames({
          eng: 'X'.repeat(config.VALIDATION.PatchTitle.maxNameLength + 1)
        });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }

      // Less than min
      try {
        await Title.patchNames({
          eng: 'X'.repeat(config.VALIDATION.PatchTitle.minNameLength - 1)
        });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });

    test('Reject - Alt names too large', async () => {
      try {
        await Title.patchNames({
          alt: 'XXX '.repeat(config.VALIDATION.PatchTitle.maxAltNamesCount).split(' ')
        });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  describe('patchDescription', () => {
    test('Pass - description changed', async () => {
      const description = 'hello world';
      const descriptionObfuscated = '     hello      world   ';

      await Title.patchDescription(descriptionObfuscated);

      expect(Title.title.description).toBe(description);
    });

    test('Reject - length missmatch', async () => {
      try {
        await Title.patchDescription('X'.repeat(config.VALIDATION.PatchTitle.maxDescriptionLength + 1));

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  describe('patchDetails', () => {
    test('Pass - details changed', async () => {
      const details = 'hello world';
      const detailsObfuscated = '     hello      world   ';

      await Title.patchDetails(detailsObfuscated);
      expect(Title.title.details).toBe(details);

      await Title.patchDetails('');
      expect(Title.title.details).toBe(null);

      await Title.patchDetails(null);
      expect(Title.title.details).toBe(null);
    });

    test('Reject - length missmatch', async () => {
      try {
        await Title.patchDetails('X'.repeat(config.VALIDATION.PatchTitle.maxDetailsLength + 1));

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  describe('patchEpisodesCount', () => {
    test('Pass - episodes count changed', async () => {
      await Title.patchEpisodesCount(10);
      expect(Title.title.episodesCount).toBe(10);

      await Title.patchEpisodesCount(0);
      expect(Title.title.episodesCount).toBe(null);

      await Title.patchEpisodesCount(null);
      expect(Title.title.episodesCount).toBe(null);
    });

    test('Reject - length missmatch', async () => {
      // Episodes count greater than maximum
      try {
        await Title.patchEpisodesCount(config.VALIDATION.PatchTitle.maxEpisode + 1);

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  describe('patchGenres', () => {
    test('Pass - genres changed', async () => {
      const genres: TAnimeGenre[] = ['3D', 'action', 'adventure'];

      await Title.patchGenres(genres);
      expect(Title.title.genres).toStrictEqual(genres);
    });

    test('Reject - genre invalid', async () => {
      try {
        // @ts-expect-error
        await Title.patchGenres(['3D', 'JFSDLEFSK', 'FSDDFSSDF', 'action']);

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_TYPE_INVALID) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  describe('patchRating', () => {
    test('Pass - rating changed', async () => {
      await Title.patchRating(10, 'IMDB');
      expect(Title.title.rating.IMDB).toBe(10);

      await Title.patchRating(0, 'IMDB');
      expect(Title.title.rating.IMDB).toBe(null);

      await Title.patchRating(null, 'IMDB');
      expect(Title.title.rating.IMDB).toBe(null);

      await Title.patchRating(8.1234, 'mal');
      expect(Title.title.rating.mal).toBe(8.12);
    });

    test('Reject - length missmatch', async () => {
      // Rating greater than maximum
      try {
        await Title.patchRating(config.VALIDATION.PatchTitle.maxRating + 1, 'IMDB');

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  describe('patchMalID', () => {
    test('Pass - mal id changed', async () => {
      const mal_id = '121212';

      await Title.patchMalID({ mal_id });
      expect(Title.title.mal_id).toBe(mal_id);

      await Title.patchMalID({ mal_id: '' });
      expect(Title.title.mal_id).toBe(null);
    });
  });

  describe('patchYear', () => {
    test('Pass - year changed', async () => {
      await Title.patchYear(getUTC().year);
      expect(Title.title.year).toBe(getUTC().year);
    });

    test('Reject - length missmatch', async () => {
      // Year lesser than minimum
      try {
        await Title.patchYear(config.VALIDATION.PatchTitle.minYear - 1);

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }

      // Year greater than maximum
      try {
        await Title.patchYear(config.VALIDATION.PatchTitle.maxYear + 1);

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  describe('patchStudios', () => {
    test('Pass - studios changed', async () => {
      const studios: string[] = ['Fullkekw', 'Aniumee', 'Hell o World'];
      const studiosObfuscated: string[] = ['      Fullkekw', '    Aniumee', ' Hell   o  World'];

      await Title.patchStudios(studiosObfuscated);
      expect(Title.title.studios).toStrictEqual(studios);
    });

    test('Reject - studio length invalid', async () => {
      // Studios count greater than maximum
      try {
        await Title.patchStudios('XXX '.repeat(config.VALIDATION.PatchTitle.maxStudioLength).split(' '));

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }

      // Studio name greater than maximum
      try {
        await Title.patchStudios(['X'.repeat(config.VALIDATION.PatchTitle.maxStudioLength + 1), 'Helkl', 'fsdfsdfsd']);

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  // Tests for typed methods are not required

  describe('parseIMDBEpisodesMeta', () => {
    test('Pass - episodes parsed', async () => {
      await Title.parseIMDBEpisodesMeta('https://imdb.com/');

      expect(true).toBeTruthy();
    });

    test('Reject - URL invalid', async () => {
      // URL parsing error
      try {
        await Title.parseIMDBEpisodesMeta('fsdhkdshfiu  sdfsfdsdfdsf');

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_INVALID_PAYLOAD) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }

      // Domain missmatch
      try {
        await Title.parseIMDBEpisodesMeta('https://google.com');

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_INVALID_PAYLOAD) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  describe('patchEpisodeMeta', () => {
    test('Pass - Add / edit episode meta', async () => {
      const eng = 'Hello world';
      const engObfuscated = ' Hello     world  ';
      const ukr = 'Васап йоу';

      let episode: ITitleEpisodeMeta;

      // Add
      await Title.patchEpisodeMeta({
        action: 'edit',
        dateOut: getUTC().timestamp,
        names: {
          eng: engObfuscated,
          ukr,
        },
        order: 1
      });

      episode = Title.title.episodesMeta.find(el => el.order === 1)!;

      expect(episode?.names.ukr).toBe(ukr);
      expect(episode?.names.eng).toBe(eng);

      // Edit
      const newEng = 'whatsup yo';

      await Title.patchEpisodeMeta({
        action: 'edit',
        dateOut: getUTC().timestamp,
        names: {
          eng: newEng,
          ukr,
        },
        order: 1
      });

      episode = Title.title.episodesMeta.find(el => el.order === 1)!;
      expect(episode?.names.eng).toBe(newEng);
    });

    test('Pass - Remove episode meta', async () => {
      // Add
      await Title.patchEpisodeMeta({
        action: 'edit',
        dateOut: getUTC().timestamp,
        names: {
          eng: '123',
          ukr: '123',
        },
        order: 2
      });

      await Title.patchEpisodeMeta({
        action: 'delete',
        dateOut: getUTC().timestamp,
        names: {
          eng: '_PASS',
          ukr: '_PASS',
        },
        order: 2
      });

      expect(Title.title.episodesMeta.find(el => el.order === 2)).toBeUndefined();
    });

    test('Reject - Names length invalid', async () => {
      // Greater than max
      try {
        await Title.patchEpisodeMeta({
          action: 'edit',
          dateOut: getUTC().timestamp,
          order: 3,
          names: {
            eng: 'X'.repeat(config.VALIDATION.PatchTitle.maxNameLength + 1),
            ukr: '123'
          }
        });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }

      // Less than min
      try {
        await Title.patchEpisodeMeta({
          action: 'edit',
          dateOut: getUTC().timestamp,
          order: 3,
          names: {
            eng: 'X'.repeat(config.VALIDATION.PatchTitle.minNameLength - 1),
            ukr: '123'
          }
        });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  describe('uploadEpisode', () => {
    const file: Express.Multer.File = {
      buffer: new Buffer('123'),
      destination: '/',
      fieldname: 'file',
      filename: '123',
      mimetype: 'png',
      originalname: '123',
      path: '/',
      size: 12341,
      stream: new Readable(),
      encoding: '123'
    };

    test('Pass - episode uploaded', async () => {
      const user = (await UserModel.findOne({ id: config.vars.INTERNAL_ROOT_USER_ID }))!;
      const dubber = (await DubberModel.findOne({ id: TestID1 }))!;
      const uploadID = '4fsdtr';
      const frames = 5;

      await Title.uploadEpisode({
        dubber,
        user,
        qualities: [1080, 240],
        episodeOrder: 1,
        file
      }, {
        id: uploadID,
        frames
      });

      const ep = Title.title.episodes.find(el => el.dubberID === dubber.id && el.order === 1);

      expect(ep).toBeTruthy();
      expect(ep?.frames.length).toBe(frames); // Must fill frames
      expect(ep?.qualities.q1080.includes(uploadID)).toBeTruthy(); // Must specify quality by default
      expect(ep?.qualities.q240?.includes(uploadID)).toBeTruthy(); // Must specify uploaded quality 
    });

    test('Reject - episode exist', async () => {
      const user = (await UserModel.findOne({ id: config.vars.INTERNAL_ROOT_USER_ID }))!;
      const dubber = (await DubberModel.findOne({ id: TestID1 }))!;

      try {
        Title.title.episodes.push({
          dubberID: dubber.id,
          frames: [],
          order: 3,
          qualities: {
            q1080: '',
            q240: null,
            q480: null,
            q4k: null,
            q720: null,
          }
        });

        await Title.uploadEpisode({
          dubber,
          user,
          qualities: [1080, 720],
          episodeOrder: 3,
          file
        });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_ALREADY_EXIST) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });

    test('Reject - access rejected', async () => {
      const user = (await UserModel.findOne({ id: TestID1 }))!;
      const dubber = (await DubberModel.findOne({ id: TestID1 }))!;

      try {
        await Title.uploadEpisode({
          dubber,
          user,
          qualities: [1080, 720],
          episodeOrder: 1,
          file
        });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_ACCESS_REJECTED) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  describe('deleteEpisode', () => {
    test('Pass - episode deleted', async () => {
      const user = (await UserModel.findOne({ id: config.vars.INTERNAL_ROOT_USER_ID }))!;
      const dubber = (await DubberModel.findOne({ id: TestID1 }))!;

      Title.title.episodes.push({
        dubberID: dubber.id,
        frames: [],
        order: 2,
        qualities: {
          q1080: '',
          q240: null,
          q480: null,
          q4k: null,
          q720: null,
        }
      });

      expect(Title.title.episodes.find(el => el.dubberID === dubber.id && el.order == 2)).toBeTruthy();

      await Title.deleteEpisode({
        order: 2,
        dubber,
        user,
      });

      expect(Title.title.episodes.find(el => el.dubberID === dubber.id && el.order == 2)).toBeUndefined();
    });

    test('Reject - access rejected', async () => {
      const user = (await UserModel.findOne({ id: TestID1 }))!;
      const dubber = (await DubberModel.findOne({ id: TestID1 }))!;

      try {
        await Title.deleteEpisode({
          order: 2,
          dubber,
          user,
        });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_ACCESS_REJECTED) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  describe('uploadPoster', () => {
    const file: Express.Multer.File = {
      buffer: new Buffer('123'),
      destination: '/',
      fieldname: 'file',
      filename: '123',
      mimetype: 'png',
      originalname: '123',
      path: '/',
      size: 12341,
      stream: new Readable(),
      encoding: '123'
    };

    test('Pass - poster uploaded', async () => {
      const user = (await UserModel.findOne({ id: config.vars.INTERNAL_ROOT_USER_ID }))!;
      const posterID = 'helloworld-123';

      await Title.uploadPoster({
        file,
        user
      }, {
        id: posterID
      });

      expect(Title.title.poster).toBe(`${config.URL.nekomi_media}/${posterID}`);
    });

    test('Reject - access rejected', async () => {
      const user = (await UserModel.findOne({ id: TestID1 }))!;
      const posterID = 'helloworld-123';

      try {
        await Title.uploadPoster({
          file,
          user
        }, {
          id: posterID
        });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_ACCESS_REJECTED) return expect(true).toBeTruthy();

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });
});
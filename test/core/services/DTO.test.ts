process.argv.push('testMode');
process.argv.push('devMode');



import AnimeService from '~/core/services/AnimeService';
import IDubber from '~/core/interfaces/Dubber.intf';
import createID from '~/utils/create-id';
import getUTC from '~/utils/get-utc';
import mongoose from 'mongoose';
import { DocumentDTO } from '~/core/services/DTO';
import { IUser } from '~/core/interfaces/User.intf';
import { config } from '~/config';



beforeAll(() => {
  mongoose.set('strictQuery', false);
  mongoose.set('strictQuery', false);
  mongoose.connect(config.mongodbUrl, {
    retryWrites: true,
  });
});



describe('DTOs', () => {
  test('User DTO', () => {
    const user: IUser = {
      avatar: '',
      banner: '',
      id: '',
      libs: [],
      roles: [],
      statistics: {
        accountCreated: 0,
        dubber_team_member: '',
        isTelegramLinked: false,
        viewtime: 0,
      },
      subscribes: [],
      telegramData: null,
      telegramLinkToken: null,
      togetherRooms: [],
      username: '',
      watchProgress: []
    };

    const withDetails = new DocumentDTO().user({ object: user, details: true });
    const withoutDetails = new DocumentDTO().user({ object: user });

    // In detailed mode all props must be present
    expect(withDetails.libs).toBeTruthy();
    expect(withDetails.subscribes).toBeTruthy();
    expect(withDetails.telegramData).toBeNull();

    // In non detailed mode (default) some props must be undefined
    expect(withoutDetails.libs).toBeUndefined();
    expect(withoutDetails.subscribes).toBeUndefined();
    expect(withoutDetails.telegramData).toBeUndefined();
  });

  test('Anime DTO', async () => {
    const anime = await new AnimeService().create({ nameEng: createID(12), savedoc: false });

    const withDetails = new DocumentDTO().anime({ object: anime, details: true });
    const withoutDetails = new DocumentDTO().anime({ object: anime });

    // In detailed mode all props must be present
    expect(withDetails.episodes).toBeTruthy();
    expect(withDetails.episodesMeta).toBeTruthy();

    // In non detailed mode (default) some props must be undefined
    expect(withoutDetails.episodes).toBeUndefined();
    expect(withoutDetails.episodesMeta).toBeUndefined();
  });

  test('Dubber DTO', () => {
    const dubber: IDubber = {
      id: '',
      nameUkr: '',
      nameEng: '',
      name: '',
      slug: '',
      avatar: config.vars.defaultAvatar,
      banner: config.vars.defaultBanner,
      description: null,
      members: [],
      membersInvited: [],
      socials: {
        instagram: null,
        telegram: null,
        tiktok: null,
        youtube: null
      },
      support: {
        bymeacoffee: null,
        diaka: null,
        monobank: null,
        patreon: null,
        privatbank: null
      },
      statistics: {
        createdAt: getUTC().timestamp
      },
      createdAt: getUTC().timestamp,
      code: ''
    };

    const withDetails = new DocumentDTO().dubber({ object: dubber, details: true });
    const withoutDetails = new DocumentDTO().dubber({ object: dubber });

    // In detailed mode all props must be present
    expect(withDetails.members).toBeTruthy();
    expect(withDetails.membersInvited).toBeTruthy();

    // In non detailed mode (default) some props must be undefined
    expect(withoutDetails.members).toBeUndefined();
    expect(withoutDetails.membersInvited).toBeUndefined();
  });
});
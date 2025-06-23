process.argv.push('testMode');
process.argv.push('devMode');



import AnimeService from '~/core/services/AnimeService';
import DocumentDTO from '~/core/services/DTOService';
import Dubber from '~/core/interfaces/Dubber.intf';
import mongoose from 'mongoose';
import { User } from '~/core/interfaces/User.intf';
import { config } from '~/config';
import { createStringID } from '~/utils/utils';
import { getUTC } from '~/utils/utils';



beforeAll(() => {
  mongoose.set('strictQuery', false);
  mongoose.set('strictQuery', false);
  mongoose.connect(config.mongodbUrl, {
    retryWrites: true,
  });
});



describe('DTOs', () => {
  test('User DTO', () => {
    const user: User = {
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
      username: '',
      watchProgress: []
    };

    const withDetails = DocumentDTO.user(user, true);
    const withoutDetails = DocumentDTO.user(user);

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
    const anime = await new AnimeService().create({ nameEng: createStringID(12), savedoc: false });

    const withDetails = DocumentDTO.anime(anime, true);
    const withoutDetails = DocumentDTO.anime(anime);

    // In detailed mode all props must be present
    expect(withDetails.episodes).toBeTruthy();
    expect(withDetails.episodesMeta).toBeTruthy();

    // In non detailed mode (default) some props must be undefined
    expect(withoutDetails.episodes).toBeUndefined();
    expect(withoutDetails.episodesMeta).toBeUndefined();
  });

  test('Dubber DTO', () => {
    const dubber: Dubber = {
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

    const withDetails = DocumentDTO.dubber(dubber, true);
    const withoutDetails = DocumentDTO.dubber(dubber);

    // In detailed mode all props must be present
    expect(withDetails.members).toBeTruthy();
    expect(withDetails.membersInvited).toBeTruthy();

    // In non detailed mode (default) some props must be undefined
    expect(withoutDetails.members).toBeUndefined();
    expect(withoutDetails.membersInvited).toBeUndefined();
  });
});
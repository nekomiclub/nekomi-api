import IDubber from '~/core/interfaces/Dubber.intf';
import getUTC from '~/utils/get-utc';
import { Anime } from '~/interfaces/Anime.intf';
import { DocumentDTO } from '~/core/services/DTO';
import { IUser } from '~/interfaces/User.intf';
import { config } from '~/config';
import { createUUID } from '~/utils/create-id';



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
        dubberTeamMember: ''
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

  test('Anime DTO', () => {
    const anime: Anime = {
      uuid: createUUID(),
      ageRate: 'PG-13',
      code: '',
      country: 'Other',
      description: '',
      details: null,
      episodes: [],
      episodesCount: 12,
      episodesMeta: [],
      genres: [],
      id: '',
      mal_id: null,
      names: {
        alt: [],
        eng: '',
        ukr: ''
      },
      poster: '',
      rating: {
        IMDB: 0,
        mal: null,
        mal_poll: null,
        Animee: null
      },
      season: 'spring',
      status: 'announcement',
      studios: [],
      type: 'ONA',
      updatedAt: 0,
      year: 2025,
      broadcast: null,
      genresNew: [],
      malId: null,
      malSyncedAt: null,
      media: 'movie',
      pictures: [],
      rate: 'g',
      related: [],
      score: {
        imdb: null,
        mal: null,
        malScoredBy: null
      },
      seasonNew: 'fall',
      slug: '',
      statusNew: 'currently_airing',
      studiosNew: []
    };

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
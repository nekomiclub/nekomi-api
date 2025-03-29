process.argv.push('testMode');
process.argv.push('devMode');



import IDubber from '~/core/interfaces/DubberIntf';
import getUTC from '~/utils/get-utc';
import { ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_SEASON, ANIME_STATUS, Anime } from '~/core/interfaces/AnimeIntf';
import { DocumentDTO } from '~/core/services/DTO';
import { IUser } from '~/core/interfaces/UserIntf';
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
      posterAdapt: null,
      description: '',
      details: null,
      episodes: [],
      episodesCount: 12,
      episodesMeta: [],
      genres: [],
      names: {
        alt: [],
        eng: '',
        ukr: ''
      },
      poster: '',
      season: ANIME_SEASON.FALL,
      status: ANIME_STATUS.CURRENTLY_AIRING,
      studios: [],
      updatedAt: 0,
      year: 2025,
      broadcast: null,
      malId: null,
      malSyncedAt: null,
      media: ANIME_MEDIA_TYPE.MOVIE,
      pictures: [],
      rate: ANIME_RATE.G,
      related: [],
      score: {
        imdb: null,
        mal: null,
        malScoredBy: null
      },
      slug: '',
      stopSync: {

      }
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
process.argv.push('testMode');
process.argv.push('devMode');



import AnimeService from '~/core/services/AnimeService';
import User from '~/core/interfaces/UserIntf';
import UserService from '~/core/services/UserService';
import createID, { createUUID } from '~/utils/create-id';
import getUTC from '~/utils/get-utc';
import mongoose from 'mongoose';
import trimString from '~/utils/trim-string';
import { ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_SEASON, ANIME_STATUS } from '~/core/interfaces/AnimeIntf';
import { Readable } from 'stream';
import { config } from '~/config';
import { shouldfail, testfail, testpass } from '~/utils/testing';



beforeAll(() => {
  mongoose.set('strictQuery', false);
  mongoose.connect(config.mongodbUrl, {
    retryWrites: true,
  });
});

afterAll(() => {
  mongoose.disconnect();
});



const TestFile: Express.Multer.File = {
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




describe('AnimeService', () => {
  const animeService = new AnimeService();
  const _vl = config.VALIDATION.Anime;

  let RootUser: User | null = null;
  let DefaultUser: User | null = null;
  let DubberMember: User | null = null;



  // Initialize anime service
  beforeAll(async () => {
    const anime = await animeService.create({ nameEng: createID(12) });
    await animeService.init(anime.uuid);

    RootUser = await new UserService().create({ username: createID(12), savedoc: false });
    RootUser.roles = ['root'];

    DefaultUser = await new UserService().create({ username: createID(12), savedoc: false });

    DubberMember = await new UserService().create({ username: createID(12), savedoc: false });
    DubberMember.roles = ['dubber_leader'];
    DubberMember.statistics.dubberTeamMember = createUUID();
    DubberMember.statistics.dubber_team_member = DubberMember.statistics.dubberTeamMember;
  });



  it('should set malId', async () => {
    /**
     * [+] Mal id can be null or <= 0
     */



    // Should set malId
    await animeService.setMalId(50505);
    expect(animeService.anime.malId).toBe(50505);

    // Should set malId
    await animeService.setMalId(0);
    expect(animeService.anime.malId).toBe(0);

    // Should set null
    await animeService.setMalId(null);
    expect(animeService.anime.malId).toBe(null);
  });



  it('should set description', async () => {
    /**
     * [+] Description can be string or null
     * [+] Description should be trimmed
     * [+] Description must be in range
     */



    const description = '  hello     world!  ';

    // Should set and trim description
    await animeService.setDescription(description);
    expect(animeService.anime.description).toBe(trimString(description));

    // Should set null if description empty
    await animeService.setDescription('');
    expect(animeService.anime.description).toBe(null);

    // Should set null
    await animeService.setDescription(null);
    expect(animeService.anime.description).toBe(null);

    // Throw error when description length is too large
    try {
      await animeService.setDescription('X'.repeat(_vl.maxDescriptionLength + 1));
      testfail();
    } catch (e) { testpass(); }
  });



  it('should set details', async () => {
    /**
     * [+] Details can be string or null
     * [+] Details should be trimmed
     * [+] Details must be in range
     */



    const details = '  hello     world!  ';

    // Should set and trim details
    await animeService.setDetails(details);
    expect(animeService.anime.details).toBe(trimString(details));

    // Should set null if details empty
    await animeService.setDetails('');
    expect(animeService.anime.details).toBe(null);

    // Should set null
    await animeService.setDetails(null);
    expect(animeService.anime.details).toBe(null);

    // Throw error when details length is too large
    try {
      await animeService.setDetails('X'.repeat(_vl.maxDetailsLength + 1));
      testfail();
    } catch (e) { testpass(); }
  });



  it('should set episodes count', async () => {
    /**
     * [+] Episodes count must be in range
     * [+] Episodes count can be null or <= 0
     */



    // Should set episodes count
    await animeService.setEpisodesCount(4);
    expect(animeService.anime.episodesCount).toBe(4);

    // Should set null
    await animeService.setEpisodesCount(-2);
    expect(animeService.anime.episodesCount).toBe(null);

    // Should set null
    await animeService.setEpisodesCount(null);
    expect(animeService.anime.episodesCount).toBe(null);

    // Throw error when episodes count is too long
    try {
      await animeService.setEpisodesCount(_vl.maxEpisodesCount + 1);
      testfail();
    } catch (e) { testpass(); }
  });




  it('should set year', async () => {
    /**
     * [+] Year must be in range
     */



    // Set year
    await animeService.setYear(getUTC().year);
    expect(animeService.anime.year).toBe(getUTC().year);

    // Throw error when year is too new
    try {
      await animeService.setYear(_vl.maxYear + 2);
      testfail();
    } catch (e) { testpass(); }

    // Throw error when year is too old
    try {
      await animeService.setYear(_vl.minYear - 2);
      testfail();
    } catch (e) { testpass(); }
  });



  it('should set rate', async () => {
    // Set rate
    await animeService.setRate(ANIME_RATE.RPLUS);
    expect(animeService.anime.rate).toBe(ANIME_RATE.RPLUS);
  });



  it('should set status', async () => {
    // Set status
    await animeService.setStatus(ANIME_STATUS.NOT_YET_AIRED);
    expect(animeService.anime.status).toBe(ANIME_STATUS.NOT_YET_AIRED);
  });



  it('should set season', async () => {
    // Set season
    await animeService.setSeason(ANIME_SEASON.SUMMER);
    expect(animeService.anime.season).toBe(ANIME_SEASON.SUMMER);
  });



  it('should set media', async () => {
    // Set media
    await animeService.setMedia(ANIME_MEDIA_TYPE.TV);
    expect(animeService.anime.media).toBe(ANIME_MEDIA_TYPE.TV);
  });



  it('should upload poster', async () => {
    /**
     * [+] Root user (or with titleEdit cap) can upload poster
     * [+] Default poster cannot be removed
     */



    if (!RootUser || !DefaultUser) return testfail();

    // First upload
    const firstData = await animeService.putPoster(TestFile, RootUser);

    expect(firstData.url).toBeTruthy();
    expect(firstData.oldPosterRemoved).toBeFalsy(); // Default poster should not be removed

    // Second upload. Old poster should be removed
    const secondData = await animeService.putPoster(TestFile, RootUser);

    expect(secondData.url).toBeTruthy();
    expect(secondData.oldPosterRemoved).toBeTruthy(); // Not default poster should be removed

    // Throw error when user without titleEdit capability try to upload poster
    await shouldfail(async () => {
      await animeService.putPoster(TestFile, DefaultUser!);
    });
  });



  it('should upload episode', async () => {
    /**
     * [todo] If episode exist, should reject
     * [todo] Order must be in range
     * [todo] Dubber member can upload episodes in own dub
     * [todo] Root user (or with seriesAdd cap) can upload episodes
     * [todo] Dubber member cannot upload episodes in not own dub
     * [todo] Should sent airing_started & new_episode events
     */



    testpass();
  });



  it('should delete episode', async () => {
    /**
     * [+] If episode exist, should delete it
     * [+] If episode does not exist, should pass it 
     * [+] Root user (or with seriesDelete cap) can delete every episode
     * [+] Dubber member can delete episodes in own dubbing
     * [+] Dubber member cannot delete episodes not in own dub
     * [+] Default user cannot delete episode
     */



    if (!RootUser || !DefaultUser || !DubberMember) return testfail();

    const dubberId = DubberMember.statistics.dubberTeamMember ?? '';
    const order = 4;

    // Push exist episode
    animeService.document?.episodes.push({
      dubberID: dubberId,
      order,
      frames: [],
      qualities: {
        q1080: `${config.URL.nekomi_media}/${createUUID()}`,
        q240: null,
        q480: null,
        q720: null,
        q4k: null,
      }
    });

    // First episode delete. Should delete episode
    const firstDelete = await animeService.deleteEpisode(dubberId, order, RootUser);

    expect(animeService.anime.episodes.some(el => el.dubberID === dubberId && el.order === order)).toBeFalsy();
    expect(firstDelete.episodeDeleted).toBeTruthy();

    // Second episode delete. Should not found
    const secondDelete = await animeService.deleteEpisode(dubberId, order, RootUser);

    expect(secondDelete.episodeDeleted).toBeFalsy();

    // Dubber team member can delete episode in own dub. Should not found
    const dubberDelete = await animeService.deleteEpisode(dubberId, order, DubberMember);

    expect(dubberDelete.episodeDeleted).toBeFalsy();



    // Throw error when dubber member try to delete not own episode
    await shouldfail(async () => {
      await animeService.deleteEpisode(createUUID(), order, DubberMember!);
    });

    // Throw error when user without seriesDelete capability try to delete episode
    await shouldfail(async () => {
      await animeService.deleteEpisode(dubberId, order, DefaultUser!);
    });
  });
});
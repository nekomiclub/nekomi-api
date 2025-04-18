process.argv.push('testMode');
process.argv.push('devMode');



import Anime, { ANIME_GENRE, ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_SEASON, ANIME_STATUS, AnimeBroadcast, AnimeStudio } from '~/core/interfaces/AnimeIntf';
import AnimeModel from '~/core/models/AnimeModel';
import AnimeService from '~/core/services/AnimeService';
import DubberService from '~/core/services/DubberService';
import User from '~/core/interfaces/UserIntf';
import UserService from '~/core/services/UserService';
import createID, { createUUID } from '~/utils/create-id';
import getUTC from '~/utils/get-utc';
import mongoose from 'mongoose';
import trimString from '~/utils/trim-string';
import { Readable } from 'stream';
import { config } from '~/config';
import { shouldfail, testfail, testpass } from '~/utils/testing';



beforeAll(() => {
  mongoose.set('strictQuery', false);
  mongoose.connect(config.mongodbUrl, {
    retryWrites: true,
  });
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
    DubberMember.statistics.dubber_team_member = createUUID();
  });



  /**
    * [+] Must set malId 
    * [+] Mal id can be null or <= 0
    */
  it('should set malId', () => {
    // Should set malId
    animeService.setMalId(50505);
    expect(animeService.anime.malId).toBe(50505);

    // Should set malId
    animeService.setMalId(0);
    expect(animeService.anime.malId).toBe(0);

    // Should set null
    animeService.setMalId(null);
    expect(animeService.anime.malId).toBe(null);
  });



  /**
    * [+] Must set description 
    * [+] Description can be string or null
    * [+] Description should be trimmed
    * [+] Description must be in range
    */
  it('should set description', () => {
    const description = '  hello     world!  ';

    // Should set and trim description
    animeService.setDescription(description);
    expect(animeService.anime.description).toBe(trimString(description));

    // Should set null if description empty
    animeService.setDescription('');
    expect(animeService.anime.description).toBe(null);

    // Should set null
    animeService.setDescription(null);
    expect(animeService.anime.description).toBe(null);

    // Throw error when description length is too large
    try {
      animeService.setDescription('X'.repeat(_vl.maxDescriptionLength + 1));
      testfail();
    } catch (e) { testpass(); }
  });



  /**
    * [+] Must set details 
    * [+] Details can be string or null
    * [+] Details should be trimmed
    * [+] Details must be in range
    */
  it('should set details', () => {
    const details = '  hello     world!  ';

    // Should set and trim details
    animeService.setDetails(details);
    expect(animeService.anime.details).toBe(trimString(details));

    // Should set null if details empty
    animeService.setDetails('');
    expect(animeService.anime.details).toBe(null);

    // Should set null
    animeService.setDetails(null);
    expect(animeService.anime.details).toBe(null);

    // Throw error when details length is too large
    try {
      animeService.setDetails('X'.repeat(_vl.maxDetailsLength + 1));
      testfail();
    } catch (e) { testpass(); }
  });



  /**
    * [+] Must set episodes count
    * [+] Episodes count must be in range
    * [+] Episodes count can be null or <= 0
    */
  it('should set episodes count', () => {
    // Should set episodes count
    animeService.setEpisodesCount(4);
    expect(animeService.anime.episodesCount).toBe(4);

    // Should set null
    animeService.setEpisodesCount(-2);
    expect(animeService.anime.episodesCount).toBe(null);

    // Should set null
    animeService.setEpisodesCount(null);
    expect(animeService.anime.episodesCount).toBe(null);

    // Throw error when episodes count is too long
    try {
      animeService.setEpisodesCount(_vl.maxEpisodesCount + 1);
      testfail();
    } catch (e) { testpass(); }
  });



  /**
    * [+] Year must be in range
    */
  it('should set year', () => {
    // Set year
    animeService.setYear(getUTC().year);
    expect(animeService.anime.year).toBe(getUTC().year);

    // Throw error when year is too new
    try {
      animeService.setYear(_vl.maxYear + 2);
      testfail();
    } catch (e) { testpass(); }

    // Throw error when year is too old
    try {
      animeService.setYear(_vl.minYear - 2);
      testfail();
    } catch (e) { testpass(); }
  });



  /**
   * [+] Must set new rate
   */
  it('should set rate', () => {
    // Set rate
    animeService.setRate(animeService.parseRate(ANIME_RATE.RPLUS));
    expect(animeService.anime.rate).toBe(ANIME_RATE.RPLUS);
  });



  /**
   * [+] Must set new status
   */
  it('should set status', () => {
    // Set status
    animeService.setStatus(animeService.parseStatus(ANIME_STATUS.NOT_YET_AIRED));
    expect(animeService.anime.status).toBe(ANIME_STATUS.NOT_YET_AIRED);
  });



  /**
   * [+] Must set new season
   */
  it('should set season', () => {
    // Set season
    animeService.setSeason(animeService.parseSeason(ANIME_SEASON.SUMMER));
    expect(animeService.anime.season).toBe(ANIME_SEASON.SUMMER);
  });



  /**
   * [+] Must set new media
   */
  it('should set media', () => {
    // Set media
    animeService.setMedia(animeService.parseMedia(ANIME_MEDIA_TYPE.TV));
    expect(animeService.anime.media).toBe(ANIME_MEDIA_TYPE.TV);
  });



  /**
    * [+] Must update poster
    * [+] Root user (or with titleEdit cap) can upload poster
    * [+] Default poster cannot be removed
    */
  it('should upload poster', async () => {
    if (!RootUser || !DefaultUser) return testfail();

    // First upload
    const firstData = await animeService.putPoster(TestFile, { user: RootUser });

    expect(firstData.url).toBeTruthy();
    expect(firstData.oldPosterRemoved).toBeFalsy(); // Default poster should not be removed

    // Second upload. Old poster should be removed
    const secondData = await animeService.putPoster(TestFile, { user: RootUser });

    expect(secondData.url).toBeTruthy();
    expect(secondData.oldPosterRemoved).toBeTruthy(); // Not default poster should be removed

    // Throw error when user without titleEdit capability try to upload poster
    await shouldfail(async () => {
      await animeService.putPoster(TestFile, { user: DefaultUser! });
    });
  });



  /**
   * [+] Must set names
   * [+] Names must be trimmed
   * [+] Name must be in range
   * [+] Alt names count must be in range
   * [+] English name must set slug
   * [+] Must check if slug is unique, if not modify it with random letters
   */
  it(`should set names`, async () => {
    await animeService.setNames({ ukr: '   hello     world  ', eng: '  lol kek   1', alt: ['hah    ah'] });

    expect(animeService.anime.names.ukr).toBe(`hello world`);
    expect(animeService.anime.names.eng).toBe(`lol kek 1`);
    expect(animeService.anime.names.alt).toStrictEqual(['hah ah']);

    expect(animeService.anime.slug).toBe(`lol-kek-1`); // English name will change the slug

    // Must change slug if it occupied
    const anime = (await AnimeModel.find())[0] as Anime;

    await animeService.setNames({ eng: anime.slug });

    expect(new RegExp(`${anime.slug}-.+`, 'gi').test(animeService.anime.slug)).toBeTruthy();

    // Should reject when name is too long
    await shouldfail(async () => {
      await animeService.setNames({ eng: 'X'.repeat(config.VALIDATION.Anime.maxNameLength + 1) });
    });

    // Should reject when alt names length is too long
    await shouldfail(async () => {
      await animeService.setNames({ alt: ['1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1'] });
    });
  });



  /**
   * [+] Must set stopsync
   */
  it(`should stop sync`, () => {
    animeService.setStopSync({ mal: true, shikimori: false });

    expect(animeService.anime.stopSync.mal).toBeTruthy();
    expect(animeService.anime.stopSync.shikimori).toBeFalsy();
  });



  /**
   * [+] Must set studios
   * [+] Studios length must be in range
   * [+] Studio name must be trimmed
   */
  it(`should set studios`, async () => {
    // contain messy names
    const studios: AnimeStudio[] = [
      { name: '    haha       lol ', malId: 12 }
    ];

    const rightStudios: AnimeStudio[] = [
      { name: 'haha lol', malId: 12 }
    ];



    await animeService.setStudios(studios);

    expect(animeService.anime.studios).toStrictEqual(rightStudios);

    await shouldfail(async () => {
      const studios = [
        { name: 'haha lol', malId: 12 },
        { name: 'haha lol', malId: 12 },
        { name: 'haha lol', malId: 12 },
        { name: 'haha lol', malId: 12 },
        { name: 'haha lol', malId: 12 },
        { name: 'haha lol', malId: 12 },
        { name: 'haha lol', malId: 12 },
        { name: 'haha lol', malId: 12 },
      ];

      await animeService.setStudios(studios);
    });
  });



  /**
   * [+] Must set genres
   * [+] Genres length must be in range
   */
  it(`should set genres`, () => {
    const genres = [ANIME_GENRE.ACTION, ANIME_GENRE.DEMENTIA];

    animeService.setGenres(genres);

    expect(animeService.anime.genres).toStrictEqual(genres);

    // Should reject when genres length is too large
    shouldfail(() => {
      animeService.setGenres([ANIME_GENRE.ACTION, ANIME_GENRE.ACTION, ANIME_GENRE.ACTION, ANIME_GENRE.ACTION, ANIME_GENRE.ACTION, ANIME_GENRE.ACTION, ANIME_GENRE.ACTION, ANIME_GENRE.ACTION]);
    });
  });



  /**
   * [+] Score must be in range
   * [+] Must set null when score is null or 0
   */
  it(`should set score`, () => {
    animeService.setScore({ imdb: 5, mal: 0, malScoredBy: null });

    expect(animeService.anime.score.imdb).toBe(5);
    expect(animeService.anime.score.mal).toBe(null);
    expect(animeService.anime.score.malScoredBy).toBe(null);

    // Must fail if scrore is out of range
    shouldfail(() => {
      animeService.setScore({ imdb: 12 });
    });
  });



  /**
   * [+] Must set poster adapt
   * [+] Dubber must exist or be null
   */
  it(`should set poster adapt`, async () => {
    const dubber = await new DubberService().create({
      nameEng: `idkssdffsdsdf`,
      nameUkr: `idkdsfdssdf`
    });

    // Dubber exist
    await animeService.setPosterAdapt(dubber.id);

    expect(animeService.anime.posterAdapt).toBe(dubber.id);

    // Set null
    await animeService.setPosterAdapt(null);

    expect(animeService.anime.posterAdapt).toBe(null);

    // Dubber id invalid
    await shouldfail(async () => {
      await animeService.setPosterAdapt(`_INVALID`);
    });
  });



  /**
   * [+] Must set new broadcast timing
   */
  it(`should set broadcast`, () => {
    const broadcast: AnimeBroadcast = {
      day: 'friday',
      time: '12:15'
    };

    animeService.setBroadcast(broadcast);

    expect(animeService.anime.broadcast).toStrictEqual(broadcast);
  });



  /**
   * [+] Must find related anime documents
   */
  it(`should set related`, async () => {
    // Prepare
    const newAnime = await new AnimeService().create({ nameEng: createID(6) });
    const newAnimeService = new AnimeService();

    await newAnimeService.init(newAnime.uuid);
    newAnimeService.setMalId(17);
    await newAnimeService.save();

    // Find related
    await animeService.setRelated([17]);

    expect(animeService.anime.related.includes(newAnime.uuid)).toBeTruthy();

    // Remove related
    await animeService.setRelated([]);

    expect(animeService.anime.related.length).toBe(0);
  });



  /**
   * [+] Must sync with myanimelist
   * [+] Must force sync
   * [+] Must not sync if prevented or sync does not timed out
   * [+] Cannot sync without mal id
   */
  it(`should sync with myanimelist`, async () => {
    // Cannot sync when mal id is not specified
    expect(await animeService.syncWithMyAnimeList()).toBeFalsy();

    animeService.setMalId(12);
    animeService.setStopSync({ mal: false });

    // Must sync
    expect(await animeService.syncWithMyAnimeList()).toBeTruthy();

    // Prevent sync
    animeService.setStopSync({ mal: true });

    expect(await animeService.syncWithMyAnimeList()).toBeFalsy();
    expect(await animeService.syncWithMyAnimeList(true)).toBeTruthy(); // Can be forced sync

    // Sync timeout
    animeService.document!.malSyncedAt = getUTC().timestamp;

    expect(await animeService.syncWithMyAnimeList()).toBeFalsy();
    expect(await animeService.syncWithMyAnimeList(true)).toBeTruthy(); // Can be forced sync
  });



  /**
    * [todo] Must reject if episode exist
    * [todo] Order must be in range
    * [todo] Dubber member can upload episodes in own dub
    * [todo] Root user (or with seriesAdd cap) can upload episodes
    * [todo] Dubber member cannot upload episodes in not own dub
    * [todo] Must send airing_started & new_episode events
    * [todo] Only admin role can upload 4k
    */
  it('should upload episode', async () => {
    testpass();
  });



  /**
    * [+] If episode exist, should delete it
    * [+] If episode does not exist, should pass it 
    * [+] Root user (or with seriesDelete cap) can delete every episode
    * [+] Dubber member can delete episodes in own dubbing
    * [+] Dubber member cannot delete episodes not in own dub
    * [+] Default user cannot delete episode
    * [+] Should delete only specified episode
    */
  it('should delete episode', async () => {
    if (!RootUser || !DefaultUser || !DubberMember) return testfail();

    const dubberId = DubberMember.statistics.dubber_team_member ?? '';
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

    animeService.document?.episodes.push({
      dubberID: dubberId,
      order: order + 1,
      frames: [],
      qualities: {
        q1080: `${config.URL.nekomi_media}/${createUUID()}`,
        q240: null,
        q480: null,
        q720: null,
        q4k: null,
      }
    });

    // Ensure that all episodes are pushed
    expect(animeService.anime.episodes.filter(el => el.dubberID === dubberId).length).toBeGreaterThanOrEqual(2);

    // First episode delete. Must delete episode
    const firstDelete = await animeService.deleteEpisode({ dubberId, order, user: RootUser });

    expect(animeService.anime.episodes.some(el => el.dubberID === dubberId && el.order === order)).toBeFalsy();
    expect(animeService.anime.episodes.some(el => el.dubberID === dubberId && el.order === order + 1)).toBeTruthy(); // Must delete only specified episode and do not touch others
    expect(firstDelete.episodeDeleted).toBeTruthy();

    // Second episode delete. Will not found
    const secondDelete = await animeService.deleteEpisode({ dubberId, order, user: RootUser });

    expect(secondDelete.episodeDeleted).toBeFalsy();

    // Dubber team member can delete episode in own dub. Will not found
    const dubberDelete = await animeService.deleteEpisode({ dubberId, order, user: DubberMember });

    expect(dubberDelete.episodeDeleted).toBeFalsy();



    // Throw error when dubber member try to delete not own episode
    await shouldfail(async () => {
      await animeService.deleteEpisode({ dubberId: createUUID(), order, user: DubberMember! });
    });

    // Throw error when user without seriesDelete capability try to delete episode
    await shouldfail(async () => {
      await animeService.deleteEpisode({ dubberId, order, user: DefaultUser! });
    });
  });
});
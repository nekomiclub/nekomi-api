import AnimeValidators from '~/utils/validators/anime-validators';
import createId from '~/utils/create-id';
import createSlug from '~/utils/create-slug';
import { ANIME_GENRE, ANIME_RATING, ANIME_SEASON, ANIME_TYPE, IAnimeSchedule } from '~/intf/IAnime';
import { AnimeRepositoryClass } from '~/repositories/AnimeRepository';
import { beforeAll, describe, expect, it } from 'vitest';
import { getUTC } from '~/utils/utils';
import { shouldfail } from '~/utils/testing-utils';





describe('AnimeRepository', () => {
  const animeServiceMain = new AnimeRepositoryClass({ testmode: true });



  beforeAll(async () => {
    await animeServiceMain.create({ saveDocument: false });
  });



  /**
   * [+] Should set mal id
   * [+] Value less than 0 should be treated as null
   * [-] Should ensure that mal id exist
   */
  it('should set malId', async () => {
    // Set numeric id
    await animeServiceMain.setMalId(123456);
    expect(animeServiceMain.document?.mal_id).toBe(123456);



    // Set nullish id (less than zero)
    await animeServiceMain.setMalId(-1);
    expect(animeServiceMain.document?.mal_id).toBe(null);



    // Set nullish id
    await animeServiceMain.setMalId(null);
    expect(animeServiceMain.document?.mal_id).toBe(null);
  });



  /**
   * [+] Should set IMDB id
   * [+] Zero-length value should be treated as null
   * [-] Should ensure that IMDB id exist
   */
  it('should set IMDB id', async () => {
    // Set string id
    await animeServiceMain.setIMDBId('tt1212');
    expect(animeServiceMain.document?.imdb_id).toBe('tt1212');



    // Set nullish id (less than zero)
    await animeServiceMain.setIMDBId('');
    expect(animeServiceMain.document?.imdb_id).toBe(null);



    // Set nullish id
    await animeServiceMain.setIMDBId(null);
    expect(animeServiceMain.document?.imdb_id).toBe(null);
  });



  /**
   * [+] Should set slug
   * [+] Should trim slug
   * [+] Should ensure that slug is not occupied, otherwise should append the id
   */
  it('should set slug', async () => {
    // Set slug
    const testslug = `testing-${createSlug(createId())}`;
    await animeServiceMain.setSlug(testslug);
    expect(animeServiceMain.document?.slug).toBe(testslug);




    // Append id if slug occupied
    const modifiedSlug = await animeServiceMain.setSlug(testslug, { _documentExist: true });
    expect(testslug).not.toBe(modifiedSlug);
    expect(animeServiceMain.document?.slug).toBe(modifiedSlug);



    // Trim slug
    const trimSlugId = createSlug(createId());
    await animeServiceMain.setSlug(`      ${trimSlugId}     `);
    expect(animeServiceMain.document?.slug).toBe(trimSlugId);
  });



  /**
   * [+] Should set hikka slug
   * [-] Should ensure that hikka slug exist
   */
  it('should set hikka slug', async () => {
    // Set hikka slug
    await animeServiceMain.setHikkaSlug('nekomiclub');
    expect(animeServiceMain.document?.hikka_slug).toBe('nekomiclub');
  });



  /**
   * [+] Should set hero poster author
   * [-] Should ensure that user exist
   */
  it('should set hero poster author', async () => {
    // Set hero poster author
    await animeServiceMain.setHeroPosterAuthor('nekomiclub');
    expect(animeServiceMain.document?.hero_poster_author).toBe('nekomiclub');
  });



  /**
   * [+] Should set title & synonyms
   * [+] Titles and synonyms should be trimmed
   * [+] Updating english title should cumulative update the slug
   * [+] Ukranian title can be null
   * [+] Title length must be in range
   * [+] Synonym title length must be in range
   * [+] Synonyms length must be in range
   */
  it('should set title', async () => {
    // Set title & synonyms
    const titleEnId = createId().toLowerCase();
    const title_en = `    ${titleEnId}   `;
    const title_ja = '    one  two';
    const title_ua = '    lol   ';
    const synonyms = ['   synonym   ', '    syn   sec'];

    await animeServiceMain.setTitle({ title_en, synonyms, title_ja, title_ua });

    expect(animeServiceMain.document?.title_en).toBe(titleEnId);
    expect(animeServiceMain.document?.slug).toBe(titleEnId); // English title should update slug
    expect(animeServiceMain.document?.title_ja).toBe('one two');
    expect(animeServiceMain.document?.title_ua).toBe('lol');
    expect(animeServiceMain.document?.title_synonims).toStrictEqual(['synonym', 'syn sec']);



    // Ukranian title can be null
    await animeServiceMain.setTitle({ title_ua: '' });
    expect(animeServiceMain.document?.title_ua).toBe(null);



    // Titles shoud be in range
    shouldfail(async () => await animeServiceMain.setTitle({ title_ja: 'x'.repeat(AnimeValidators.limits.MAX_TITLE_LENGTH + 5) })); // Title length must be in range
    shouldfail(async () => await animeServiceMain.setTitle({ synonyms: ['x'.repeat(AnimeValidators.limits.MAX_TITLE_LENGTH + 5)] })); // Synonym must be in range
    shouldfail(async () => await animeServiceMain.setTitle({ synonyms: Array(AnimeValidators.limits.MAX_SYNOPSIS_LENGTH + 5) })); // Synonyms length must be in range
  });



  /**
   * [+] Should set synopsis
   * [+] Synopsis should be trimmed
   * [+] Synopsis shoud be in range
   */
  it('should set synopsis', () => {
    // Set synopsis
    const synopsis_en = '    hello     world     ';
    const synopsis_ua = '    привіт     світ     ';

    animeServiceMain.setSynopsis({ synopsis_en, synopsis_ua });
    expect(animeServiceMain.document?.synopsis_en).toBe(`hello world`);
    expect(animeServiceMain.document?.synopsis_ua).toBe(`привіт світ`);



    // Synopsis should be in range
    shouldfail(() => animeServiceMain.setSynopsis({ synopsis_en: 'x'.repeat(AnimeValidators.limits.MAX_SYNOPSIS_LENGTH + 5) }));
  });



  /**
   * [+] Should set score & scored by
   * [+] Score precision should equal 2, Scored by should equal 0
   * [+] Score & scored by should be in range
   */
  it('should set score', () => {
    // Set score & scored by
    animeServiceMain.setScore({ score: 4.5333, scoredBy: 312.23 });
    expect(animeServiceMain.document?.score).toBe(4.53);
    expect(animeServiceMain.document?.scored_by).toBe(312);



    // Score & scored by must be in range
    shouldfail(() => animeServiceMain.setScore({ score: AnimeValidators.limits.MAX_SCORE + 5 }));
    shouldfail(() => animeServiceMain.setScore({ score: AnimeValidators.limits.MIN_SCORE - 5 }));
    shouldfail(() => animeServiceMain.setScore({ scoredBy: AnimeValidators.limits.MAX_SCORED_BY + 5 }));
    shouldfail(() => animeServiceMain.setScore({ scoredBy: AnimeValidators.limits.MIN_SCORED_BY - 5 }));
  });



  // /**
  //  * [-] Should append related document
  //  * [-] Should ensure that document exist
  //  */
  // it('should append related', () => { });



  // /**
  //  * [-] Should remove related document
  //  */
  // it('should remove related', () => { });



  // /**
  //  * [+] Should set related
  //  * 
  //  * @notice Temporary method
  //  */
  // it('should set related', () => {
  //   const related = ['foo', 'bar'];

  //   // Set related
  //   animeServiceMain.setRelated(related);
  //   expect(animeServiceMain.document?.relations).toStrictEqual(related);
  // });



  // /**
  //  * [-] Should append studio
  //  * [-] Should ensure that studio exist
  //  */
  // it('should append studio', () => { });



  // /**
  //  * [-] Should remove studio
  //  */
  // it('should remove studio', () => { });



  // /**
  //  * [+] Should set studios
  //  * 
  //  * @notice Temporary method
  //  */
  // it('should set studios', () => {
  //   const studios = ['foo', 'bar'];

  //   // Set studios
  //   animeServiceMain.setStudios(studios);
  //   expect(animeServiceMain.document?.studios).toStrictEqual(studios);
  // });



  /**
   * [+] Should set schedule
   * [-] Should ensure that each episode is unique
   */
  it('should set schedule', () => {
    const schedule: IAnimeSchedule[] = [
      { episode: 1, airing_at: getUTC(422722142).ISO },
      { episode: 2, airing_at: getUTC(4227221).ISO },
    ];

    animeServiceMain.setSchedule(schedule);
    expect(animeServiceMain.document?.schedule).toStrictEqual(schedule);
  });



  /**
   * [+] Should set genres
   * [-] Should ensure that each genre is unique
   */
  it('should set genres', () => {
    const genres: ANIME_GENRE[] = [ANIME_GENRE.ACTION, ANIME_GENRE.COMEDY];

    animeServiceMain.setGenres(genres);
    expect(animeServiceMain.document?.genres).toStrictEqual(genres);
  });



  /**
   * [+] Should set rating
   */
  it('should set rating', () => {
    // Set rating
    animeServiceMain.setRating(ANIME_RATING.RPLUS);
    expect(animeServiceMain.document?.rating).toBe(ANIME_RATING.RPLUS);
  });



  /**
   * [+] Should set season
   */
  it('should set season', () => {
    // Set season
    animeServiceMain.setSeason(ANIME_SEASON.SUMMER);
    expect(animeServiceMain.document?.season).toBe(ANIME_SEASON.SUMMER);
  });



  /**
   * [-] Should set type
   */
  it('should set type', () => {
    // Set type
    animeServiceMain.setType(ANIME_TYPE.SPECIAL);
    expect(animeServiceMain.document?.type).toBe(ANIME_TYPE.SPECIAL);
  });



  /**
   * [-] Should set isDMCARestricted
   */
  it('should set isDMCARestricted', () => {
    // Set isDMCARestricted
    animeServiceMain.setIsDMCARestcited(true);
    expect(animeServiceMain.document?.is_DMCA_restricted).toBe(true);
  });




  // /**
  //  * [-] Should edit episode meta
  //  */
  // it('should edit episode meta', () => { });



  // /**
  //  * [-] Should remove episode meta
  //  */
  // it('should remove episode meta', () => { });



  // /**
  //  * [-] Should upload hero poster
  //  */
  // it('should upload hero poster', () => { });



  // /**
  //  * [-] Should upload picture
  //  */
  // it('should upload picture', () => { });



  // /**
  //  * [-] Should remove picture
  //  */
  // it('should remove picture', () => { });
});
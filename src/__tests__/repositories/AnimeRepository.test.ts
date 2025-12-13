import { ANIME_GENRE, ANIME_RATE, ANIME_SEASON, ANIME_TYPE, IAnimeSchedule } from '~/intf/IAnime';
import { AnimeRepositoryClass } from '~/repositories/AnimeRepository';
import { beforeAll, describe, expect, it } from 'vitest';





describe('AnimeRepository', () => {
  const animeServiceMain = new AnimeRepositoryClass();



  beforeAll(async () => {
    await animeServiceMain.create({ saveDocument: false });
  });



  /**
   * [+] Should set malId
   * [+] Value less than 0 should be treated as null
   */
  it('should set malId', () => {
    // Set numeric id
    animeServiceMain.setMalId(123456);
    expect(animeServiceMain.document?.mal_id).toBe(123456);



    // Set nullish id (less than zero)
    animeServiceMain.setMalId(-1);
    expect(animeServiceMain.document?.mal_id).toBe(null);



    // Set nullish id
    animeServiceMain.setMalId(null);
    expect(animeServiceMain.document?.mal_id).toBe(null);
  });



  /**
   * [+] Should set IMDB id
   * [+] Zero-length value should be treated as null
   */
  it('should set IMDB id', () => {
    // Set string id
    animeServiceMain.setIMDBId('tt1212');
    expect(animeServiceMain.document?.imdb_id).toBe('tt1212');



    // Set nullish id (less than zero)
    animeServiceMain.setIMDBId('');
    expect(animeServiceMain.document?.imdb_id).toBe(null);



    // Set nullish id
    animeServiceMain.setIMDBId(null);
    expect(animeServiceMain.document?.imdb_id).toBe(null);
  });



  /**
   * [-] Should set slug
   * [-] Should ensure that slug is not occupied, otherwise should append the id
   */
  it('should set slug', () => { });



  /**
   * [-] Should set hikka slug
   * [-] Should ensure that slug exist
   */
  it('should set hikka slug', () => { });



  /**
   * [+] Should set hero poster author
   * [-] Should ensure that user exist
   */
  it('should set hero poster author', () => {
    // Set hero poster author
    animeServiceMain.setHeroPosterAuthor('nekomiclub');
    expect(animeServiceMain.document?.hero_poster_author).toBe('nekomiclub');
  });



  /**
   * [-] Should set title & synonyms
   * [-] Updating english title should cumulative update the slug
   */
  it('should set title', () => { });



  /**
   * [-] Should set synopsis
   */
  it('should set synopsis', () => { });



  /**
   * [-] Should set score
   */
  it('should set score', () => { });



  // /**
  //  * [-] Should append related document
  //  * [-] Should ensure that document exist
  //  */
  // it('should append related', () => { });



  // /**
  //  * [-] Should remove related document
  //  */
  // it('should remove related', () => { });



  /**
   * [+] Should set related
   * 
   * @notice Temporary method
   */
  it('should set related', () => {
    const related = ['foo', 'bar'];

    // Set related
    animeServiceMain.setRelated(related);
    expect(animeServiceMain.document?.related).toStrictEqual(related);
  });



  // /**
  //  * [-] Should append studio
  //  * [-] Should ensure that studio exist
  //  */
  // it('should append studio', () => { });



  // /**
  //  * [-] Should remove studio
  //  */
  // it('should remove studio', () => { });



  /**
   * [+] Should set studios
   * 
   * @notice Temporary method
   */
  it('should set studios', () => {
    const studios = ['foo', 'bar'];

    // Set studios
    animeServiceMain.setStudios(studios);
    expect(animeServiceMain.document?.studios).toStrictEqual(studios);
  });



  /**
   * [+] Should set schedule
   * [-] Should ensure that each episode is unique
   */
  it('should set schedule', () => {
    const schedule: IAnimeSchedule[] = [
      { episode: 1, airing_at: 0 },
      { episode: 2, airing_at: 20 },
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
   * [+] Should set rate
   */
  it('should set rate', () => {
    // Set rate
    animeServiceMain.setRate(ANIME_RATE.RPLUS);
    expect(animeServiceMain.document?.rate).toBe(ANIME_RATE.RPLUS);
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
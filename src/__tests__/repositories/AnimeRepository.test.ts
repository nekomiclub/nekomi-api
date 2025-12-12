import { AnimeRepositoryClass } from '~/repositories/AnimeRepository';



describe('AnimeRepository', () => {
  const animeServiceMain = new AnimeRepositoryClass();



  beforeAll(async () => {
    await animeServiceMain.create({ saveDocument: false });
  });



  /**
   * [-] Should set malId (number | null)
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
});
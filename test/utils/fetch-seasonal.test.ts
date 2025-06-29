process.argv.push('testMode');
process.argv.push('devMode');

import fetchCurrentSeasonAnime from '~/utils/fetch-seasonal';
import mongoose from 'mongoose';
import { ANIME_SEASON } from '~/core/interfaces/Anime.intf';
import { config } from '~/config';
import { getUTC } from '~/utils/utils';



beforeAll(() => {
  mongoose.set('strictQuery', false);
  mongoose.connect(config.mongodbUrl, {
    retryWrites: true,
  });
});



describe('Test fetchSeasonalAnime util', () => {
  /**
   * [+] Year must be current
   * [+] Season must be current
   */
  it('should work fine', async () => {
    const data = await fetchCurrentSeasonAnime({ month: 6 });

    expect(data?.year).toBe(getUTC().year);
    expect(data?.season).toBe(ANIME_SEASON.SUMMER);
  });



  /**
   * [+] Year must be + 1
   * [+] Season must winter
   */
  it('should increment year if month is december', async () => {
    const data = await fetchCurrentSeasonAnime({ month: 11 });

    expect(data?.year).toBe(getUTC().year + 1);
    expect(data?.season).toBe(ANIME_SEASON.WINTER);
  });
});
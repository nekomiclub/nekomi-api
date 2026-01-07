/** @fileoverview Isolated runtime functions */

import AnimeEpisodeService from './services/AnimeEpisodeService';
import AnimeUpdateCrawlerClass from './algorithms/AnimeUpdateCrawler';
import Logger from './services/LoggerService';
import conf from './conf';
import ms from 'ms';
import runCRONJob from './utils/run-cron-job';
import { MAdminDubbersMap, MAnimePlayer } from './utils/migration-utils';



export default async function Runtime() {
  try {
    // * === MIGRATION FUNCTIONS
    if (conf.env.ENV === 'deploy') await MAnimePlayer();
    if (conf.env.ENV === 'deploy') await MAdminDubbersMap();



    const AnimeUpdateCrawler = new AnimeUpdateCrawlerClass();



    await AnimeEpisodeService.updateDubbersMap();
    await AnimeEpisodeService.invoke('eOXLEi98'); // s3 p1
    await AnimeEpisodeService.invoke('ECyyfoJ1'); // s3 p2
    await AnimeEpisodeService.invoke('Y6qIOidO'); // s1 p3



    // * === OTHER FUNCTIONS
    if (conf.env.ENV === 'deploy') await runCRONJob('AnimeUpdateCrawler', ms('24 hour'), async () => await AnimeUpdateCrawler.reset());
    // await runCRONJob('AnimeEpisodeUpdateCrawler', ms('15 min'), () => { });
  } catch (e) {
    Logger.error(`[System/Runtime]: An error occured while processing one of runtime functions`, e);
  }
}
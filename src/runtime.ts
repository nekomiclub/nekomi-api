/** @fileoverview Isolated runtime functions */

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



    // * === OTHER FUNCTIONS
    if (conf.env.ENV === 'deploy') await runCRONJob('AnimeUpdateCrawler', ms('24 hour'), async () => await AnimeUpdateCrawler.reset());
    // await runCRONJob('AnimeEpisodeUpdateCrawler', ms('15 min'), () => { });
  } catch (e) {
    Logger.error(`[System/Runtime]: An error occured while processing one of runtime functions`, e);
  }
}
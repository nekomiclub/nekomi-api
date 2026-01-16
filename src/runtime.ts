/** @fileoverview Runtime functions */

import AnimePlayerUpdateCrawler from './algorithms/AnimePlayerUpdateCrawler';
import AnimeUpdateCrawler from './algorithms/AnimeUpdateCrawler';
import Logger from './services/LoggerService';
import conf from './conf';
import ms from 'ms';
import runCRONJob from './utils/run-cron-job';
import { MAdminDubbersMap, MAnimeDocument, MAnimePlayer } from './utils/migration-utils';



export default async function Runtime() {
  try {
    // * === MIGRATION FUNCTIONS
    if (conf.env.ENV === 'deploy') await MAnimeDocument();
    if (conf.env.ENV === 'deploy') await MAdminDubbersMap();
    if (conf.env.ENV === 'deploy') MAnimePlayer();



    // await AnimePlayerUpdateCrawler.updateDubbersMap();
    // await AnimePlayerUpdateCrawler.syncAnimePlayer('uKiM7NOm');

    // * === OTHER FUNCTIONS
    if (conf.env.ENV === 'deploy') await runCRONJob('AnimeUpdateCrawler', ms('24 hour'), AnimeUpdateCrawlerJob);
    if (conf.env.ENV === 'deploy') await runCRONJob('AnimeEpisodeUpdateCrawler', ms('15 min'), AnimePlayerUpdateCrawlerJob);
  } catch (e) {
    Logger.error(`[System/Runtime]: An error occured while processing one of runtime functions`, e);
  }
}





async function AnimeUpdateCrawlerJob() {
  await AnimeUpdateCrawler.reset();
}

async function AnimePlayerUpdateCrawlerJob() {
  await AnimePlayerUpdateCrawler.updateDubbersMap();
  await AnimePlayerUpdateCrawler.reset();
}
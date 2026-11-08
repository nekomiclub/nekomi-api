/** @fileoverview Runtime functions */

import AnimePlayerUpdateCrawler from './algorithms/AnimePlayerUpdateCrawler.js';
import AnimeUpdateCrawler from './algorithms/AnimeUpdateCrawler.js';
import Logger from './services/LoggerService.js';
import env from '~/utils/env.js';
import ms from 'ms';
import runCRONJob from './utils/run-cron-job.js';
import { MAnimePlayer } from './utils/migration-utils.js';



export default async function Runtime() {
  try {
    // * === MIGRATION FUNCTIONS
    if (env('ENV') === 'deploy') MAnimePlayer();

    // * === OTHER FUNCTIONS
    if (env('ENV') === 'deploy') await runCRONJob('AnimeUpdateCrawler', ms('24 hour'), AnimeUpdateCrawlerJob);
    if (env('ENV') === 'deploy') await runCRONJob('AnimeEpisodeUpdateCrawler', ms('15 min'), AnimePlayerUpdateCrawlerJob);
  } catch (e) {
    Logger.error(`[System/Runtime]: An error occured while processing one of runtime functions`, e);
  }
}





async function AnimeUpdateCrawlerJob() {
  await AnimeUpdateCrawler.reset();
}

async function AnimePlayerUpdateCrawlerJob() {
  await AnimePlayerUpdateCrawler.updateTeamsMap();
  await AnimePlayerUpdateCrawler.reset();
}
import Search from '~/services/SearchService';
import fs from 'fs';
import path from 'path';
import { ANIME_SEASON, AnimeMonthSeasons } from '~/core/interfaces/Anime.intf';
import { Logger } from '~/services/LoggerService';
import { MyAnimeList } from '~/core/services/API/MyAnimeList.api';
import { TestMode } from '~/config';
import { getUTC } from './utils';



interface Props {
  month?: number
}

interface Payload {
  year?: number
  season?: ANIME_SEASON
}


const LOGDIR = `${path.resolve()}/.dump`;
const LOGPATH = `${LOGDIR}/fetch-seasonal.json`;

/** CRON Job for this handler */
export async function cronCurrentSeasonAnime() {
  try {
    // Create log dir & file if not exist
    if (!fs.existsSync(LOGPATH)) {
      fs.mkdirSync(LOGDIR, { recursive: true });
      fs.writeFileSync(LOGPATH, '{}');
    }

    const logs = JSON.parse(fs.readFileSync(LOGPATH).toString()) ?? {};
    const { season, year } = getCurrentAnimeSeason();
    const header = `${season}:${year}`;

    // Supress if season fetched
    if (logs[header]) return;

    await fetchCurrentSeasonAnime();

    logs[header] = true;
    fs.writeFileSync(LOGPATH, JSON.stringify(logs, null, 2));

    Logger.info(`[FetchSeasonal]: CRON Job succeeded`);
  } catch (e) {
    Logger.fail(`[FetchSeasonal]: CRON Job failed`, e);
  }
}



/** Get current season & year */
export function getCurrentAnimeSeason(props?: Props): Required<Payload> {
  let year = getUTC().year;
  const monthIndex = props?.month ?? getUTC().month - 1;
  const season = AnimeMonthSeasons[monthIndex];

  // Increment year if current month is december
  if (monthIndex === 11) year += 1;

  return { season, year };
}

/** 
 * Fetch seasonal anime from MyAnimeList
 *
 * @returns {Payload} in test mode instead of actual sync
 * @tested
 */
export default async function fetchCurrentSeasonAnime(props?: Props): Promise<Payload> {
  const { season, year } = getCurrentAnimeSeason(props);
  if (TestMode) return { year, season };

  Logger.debug(`[FetchSeasonal]: Starting fetch seasonal anime for ${season} ${year}...`);
  await MyAnimeList.syncSeasonalAnime({ year, season });
  await Search.update('anime');

  return {};
}
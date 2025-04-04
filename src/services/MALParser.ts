import AnimeService from '~/core/services/AnimeService';
import { ANIME_SEASON } from '~/core/interfaces/AnimeIntf';
import { Logger } from './LoggerService';
import { MALAPI } from '~/core/services/API/MAL.api';



interface FetchSeasonalProps {
  season: ANIME_SEASON
  year: number
}



export default class MALParser {
  /** Parse myanimelist anime's */
  static async fetchSeasonal({ season, year }: FetchSeasonalProps) {
    const data = await MALAPI.getSeasonalAnime({ season, year });

    for (const key in data) {
      try {
        const node = data[key];

        const animeService = new AnimeService();

        const exist = await animeService.safeGetByQuery(`${node.id}`);
        if (exist) {
          Logger.debug(`[MALParser]: Anime already exist, so it will be skipped from fetch seasonal. [malId: ${node.id}]`);

          continue;
        }

        const title = node.alternative_titles?.en ?? node.title;
        const anime = await animeService.create({ nameEng: title });

        await animeService.init(anime.uuid);
        animeService.setMalId(node.id);
        animeService.setDescription(node.synopsis ?? null);

        await animeService.setNames({
          ukr: title,
          eng: title
        });

        await animeService.save();
        await animeService.syncWithMyAnimeList(true);

        Logger.info(`[MALParser]: Seasonal anime fetched. [uuid: ${anime.uuid}; malId: ${node.id}; season: ${season}:${year}]`);
      } catch (e) {
        Logger.fail(`[MALParser]: Failed to parse anime`, e);
        continue;
      }
    }
  }
}
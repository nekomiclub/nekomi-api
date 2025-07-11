import { ASHDI_DUBBERS_MAP, IAshdiVOD, IAshdiVODSeason } from '~/core/interfaces/AshdiVOD.intf';
import { Ashdi } from '~/core/services/API/Ashdi.api';
import { IMDB } from '~/core/services/API/IMDB.api';
import { Logger } from './LoggerService';
import { getUTC } from '~/utils/utils';



interface IFetchAshdiProps {
  title: string
}

interface IGetSeason {
  season: number
  part: number
}



class AshdiVODServ {
  async fetchAshdi({ title }: IFetchAshdiProps) {
    try {
      // Fetch IMDB id
      const imdbSearch = await IMDB.searchTitles({ query: title });
      const imdbId = imdbSearch[0].id;
      if (!imdbId) return Logger.debug(`[AshdiVODService]: Cannot find IMDB title with name "${title}"`);

      // Fetch ASHDI
      const { pl } = await Ashdi.getTitle({ imdbId });

      const vod: IAshdiVOD = {
        imdbId,
        malIds: [],
        nekomiIds: [],
        seasons: [],
        createdAt: getUTC().timestamp,
        updatedAt: getUTC().timestamp
      };

      // Parse episodes
      pl.forEach(ashdiDubber => {
        const dubberId = ASHDI_DUBBERS_MAP[ashdiDubber.title.trim()];
        if (!dubberId) return Logger.fail(`[AshdiVODService]: Dubber id not mapped (${ashdiDubber.title})`);

        ashdiDubber.folder.forEach(ashdiSeason => {
          const seasonIndex = Number(ashdiSeason.title.trim().replace('Сезон', ''));
          if (isNaN(seasonIndex)) return Logger.fail(`[AshdiVODService]: Season index is NaN (${ashdiSeason.title})`);

          const season: IAshdiVODSeason = {
            season: seasonIndex,
            episodes: [],
            malId: null,
            nekomiId: null,
          };

          ashdiSeason.folder.forEach(ashdiEpisode => {
            const episodeOrder = Number(ashdiEpisode.title.trim().replace('Серія', ''));
            if (isNaN(episodeOrder)) return Logger.fail(`[AshdiVODService]: Episode order is NaN (${ashdiEpisode.title})`);

            season.episodes.push({
              dubberID: dubberId,
              frames: [],
              order: episodeOrder,
              qualities: {
                q1080: ashdiEpisode.file,
                q240: null,
                q480: null,
                q4k: null,
                q720: null
              },
            });
          });

          vod.seasons.push(season);
        });
      });

      console.log(vod);
    } catch (e) {
      Logger.fail(`[AshdiVODService]: Ashdi fetch failed`, e);
    }
  }

  getSeason(title: string): IGetSeason {
    const seasonMatcher = title.match(/season\s(\w?.)/gi); // myanimelist generally use "Season {X}" to match season order
    const seasonIndex: number = seasonMatcher ? Number(seasonMatcher[0].replace(/season\s/gi, '')) : 1; // Retrieve season order or set default (1)

    const partMatcher = title.match(/part\s(\w?.)/gi); // myanimelist generally use "Part {X}" to match part order
    const partIndex: number = partMatcher ? Number(partMatcher[0].replace(/part\s/gi, '')) : 1; // Retrieve part order or set default (1)

    return {
      season: seasonIndex,
      part: partIndex
    };
  }
}



const AshdiVODService = new AshdiVODServ();
export default AshdiVODService;
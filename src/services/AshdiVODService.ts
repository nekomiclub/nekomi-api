import AshdiVODModel from '~/core/models/AshdiVODModel';
import { ASHDI_DUBBERS_MAP, IAshdiVOD, IAshdiVODSeason } from '~/core/interfaces/AshdiVOD.intf';
import { AnimeEpisode } from '~/core/interfaces/Anime.intf';
import { Ashdi } from '~/core/services/API/Ashdi.api';
import { IMDB } from '~/core/services/API/IMDB.api';
import { Logger } from './LoggerService';
import { config } from '~/config';
import { getUTC } from '~/utils/utils';



interface IGetEpisodesProps {
  malId: number
  title: string

  forceUpdate?: boolean
}

interface IFetchAshdiProps {
  title: string

  malId?: number
  season?: number
}

interface IGetSeason {
  season: number
  part: number
}



class AshdiVODServ {
  async getEpisodes({ malId, title, forceUpdate }: IGetEpisodesProps): Promise<AnimeEpisode[]> {
    const { part, season } = this.getSeason(title);

    const vod = await AshdiVODModel.findOne({ malIds: { $in: malId } });
    if (!vod || getUTC().timestamp > vod.updatedAt + config.vars.AshdiSyncCooldown || forceUpdate) this.updateVOD({ title, malId, season }); // update vod if it is not exist, sync cooled down or forced

    const episodes: AnimeEpisode[] = vod?.seasons.find(el => el.season === season)?.episodes ?? [];

    return episodes;
  }

  async updateVOD({ title, malId, season: preservedSeasonIndex }: IFetchAshdiProps) {
    try {
      // Find by malId
      let vod = await AshdiVODModel.findOne({ malIds: { $in: malId } });
      let imdbId = vod?.imdbId;

      // Fetch IMDB id if vod not found
      if (!imdbId) {
        const imdbSearch = await IMDB.searchTitles({ query: title });
        imdbId = imdbSearch[0].id;
      }

      if (!imdbId) return Logger.debug(`[AshdiVODService]: Cannot find IMDB title with name "${title}"`);

      // Find by imdbId
      if (!vod) vod = await AshdiVODModel.findOne({ imdbId });

      // Create new vod if not found neither malId nor imdbId
      if (!vod) {
        const instance: IAshdiVOD = {
          imdbId,
          malIds: [],
          seasons: [],
          createdAt: getUTC().timestamp,
          updatedAt: getUTC().timestamp
        };

        vod = new AshdiVODModel(instance);
        Logger.debug(`[AshdiVODService]: New VOD created. [imdbId: ${imdbId}]`);
      }



      // Fetch ASHDI
      const { pl } = await Ashdi.getTitle({ imdbId });
      const seasons: IAshdiVODSeason[] = [];

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
          };

          // Match season with malId
          if (malId !== undefined && preservedSeasonIndex === seasonIndex) {
            if (!vod?.malIds.includes(malId)) vod?.malIds.push(malId);
          }

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

          seasons.push(season);
        });
      });


      vod.seasons = seasons;
      vod.updatedAt = getUTC().timestamp;

      await vod.save();

      console.log(vod);
      Logger.debug(`[AshdiVODService]: VOD for ${vod.imdbId} updated`);
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
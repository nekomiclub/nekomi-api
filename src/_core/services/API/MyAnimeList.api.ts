import AnimeService from '~/core/services/AnimeService';
import { $mal } from '~/services/HTTPService';
import { ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_SEASON } from '~/core/interfaces/Anime.intf';
import { Logger } from '~/services/LoggerService';
import { MyAnimeListNode } from '~/core/interfaces/types';



interface GetAnimeProps {
  id: number
  fields: (keyof MyAnimeListNode)[]
}

interface GetSeasonalAnimeProps {
  season: ANIME_SEASON
  year: number
}

interface FetchSeasonalProps {
  season: ANIME_SEASON
  year: number
}



const baseURL = 'https://api.myanimelist.net/v2';

export class MyAnimeList {
  /** Fetch myanimelist anime */
  static async getAnime({ id, fields }: GetAnimeProps): Promise<MyAnimeListNode> {
    const url = `${baseURL}/anime/${id}`;
    Logger.trace(`[MyAnimeList]: GET - ${url.replace(baseURL, '')}`);

    const { data } = await $mal.get<MyAnimeListNode>(`${baseURL}/anime/${id}`, {
      params: {
        fields: fields.join(', ')
      }
    });

    return data;
  }

  /** Fetch myanimelist seasonal anime. Will skip G, PG and Rx, Different media types from TV */
  static async getSeasonalAnime({ season, year }: GetSeasonalAnimeProps): Promise<MyAnimeListNode[]> {
    const url = `${baseURL}/anime/season/${year}/${season}`;
    Logger.trace(`[MyAnimeList]: GET - ${url.replace(baseURL, '')}`);

    const fields: (keyof MyAnimeListNode)[] = [
      'alternative_titles',
      'rating',
      'media_type',
      'synopsis'
    ];

    const { data } = await $mal.get<{ data: { node: MyAnimeListNode }[] }>(`/anime/season/${year}/${season}`, {
      params: {
        limit: 70,
        sort: 'anime_num_list_users',
        fields: fields.join(',')
      }
    });

    const parsed: MyAnimeListNode[] = [];

    data.data.forEach(el => {
      const node = el.node;

      if (!node.rating || node.rating === ANIME_RATE.G || node.rating === ANIME_RATE.PG || node.rating === ANIME_RATE.RX) return;
      if (!node.media_type || node.media_type !== ANIME_MEDIA_TYPE.TV) return;

      parsed.push(node);
    });

    return parsed;
  }



  /** Fetch myanimelist seasonal anime or force update exist */
  static async syncSeasonalAnime({ season, year }: FetchSeasonalProps) {
    const data = await this.getSeasonalAnime({ season, year });

    for (const key in data) {
      try {
        const node = data[key];
        const title = node.alternative_titles?.en ?? node.title;

        const animeService = new AnimeService();

        const exist = await animeService.safeGetByQuery(`${node.id}`);
        if (exist) {
          await animeService.init(`${node.id}`);
          await animeService.syncWithMyAnimeList(true);

          Logger.debug(`[MyAnimeList]: Anime already exist, it will be skipped from fetch seasonal. [malId: ${node.id}]`);

          continue;
        }

        const anime = await animeService.create({ nameEng: title });

        await animeService.init(anime.uuid);
        animeService.setMalId(node.id);
        animeService.setDescription(node.synopsis ?? null);

        await animeService.setNames({
          ukr: title,
          eng: title,
          alt: [node.title]
        });

        await animeService.save();
        await animeService.syncWithMyAnimeList(true);

        Logger.info(`[MyAnimeList]: Seasonal anime fetched. [uuid: ${anime.uuid}; malId: ${node.id}; season: ${season}:${year}]`);
      } catch (e) {
        Logger.fail(`[MyAnimeList]: Failed to parse anime`, e);
        continue;
      }
    }
  }
}
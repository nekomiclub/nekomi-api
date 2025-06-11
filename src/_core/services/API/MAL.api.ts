import { $mal } from '~/services/HTTPService';
import { ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_SEASON } from '~/core/interfaces/Anime.intf';
import { Logger } from '~/services/LoggerService';
import { MyAnimeListNode } from '~/core/interfaces/types';
import { config } from '~/config';



interface GetAnimeProps {
  id: number
  fields: (keyof MyAnimeListNode)[]
}

interface GetSeasonalAnimeProps {
  season: ANIME_SEASON
  year: number
}



const baseURL = config.URL.MyanimelistAPI;

export class MALAPI {
  /** Fetch myanimelist anime */
  static async getAnime({ id, fields }: GetAnimeProps): Promise<MyAnimeListNode> {
    const url = `${baseURL}/anime/${id}`;
    Logger.trace(`[MyAnimeListAPI]: GET - ${url.replace(baseURL, '')}`);

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
    Logger.trace(`[MyAnimeListAPI]: GET - ${url.replace(baseURL, '')}`);

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
}
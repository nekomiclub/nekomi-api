import { $mal } from '~/services/HTTPService';
import { ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_SEASON } from '~/core/interfaces/AnimeIntf';
import { Logger } from '~/services/LoggerService';
import { MyAnimeListNode } from '~/core/interfaces/types';
import { config } from '~/config';



interface GetSeasonalAnimeProps {
  season: ANIME_SEASON
  year: number
}



export class MALAPI {
  /** Fetch myanimelist seasonal anime. Will skip G, PG and Rx, Different media types from TV */
  static async getSeasonalAnime({ season, year }: GetSeasonalAnimeProps): Promise<MyAnimeListNode[]> {
    const url = `${config.URL.MyanimelistAPI}/anime/season/${year}/${season}`;
    Logger.trace(`[FullkekwAuthorityAPI]: GET - ${url.replace(config.URL.MyanimelistAPI, '')}`);

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
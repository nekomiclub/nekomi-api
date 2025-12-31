import AnimeRepository from '~/repo/AnimeRepository';
import CacheService from '~/service/CacheService';
import DTOService from '~/service/DataTransferService';
import Logger from '~/service/LoggerService';
import conf from '~/conf';
import ms from 'ms';
import { AnimeCardType } from '~/intf/IAnime';
import { HandleRequest } from '~/utils/http-utils';
import { IHomeFeedHero } from '~/intf/types';
import { Middleware } from '~/service/MiddlewareService';
import { removeMarkdown } from '~/utils/utils';



interface IFeed {
  hero: IHomeFeedHero[]
  hot: AnimeCardType[]
  highest_rate: AnimeCardType[]
  updated_recently: AnimeCardType[]
}

interface IResponse extends IFeed {
  message: string
}



const FeedCacheService = new CacheService('HomeFeed', { ttl: ms('1day') });
const feedCacheId = `~feed`;



/**
 * Get home feed
 */
const endpoint = HandleRequest(async (req, res) => {
  const cache = FeedCacheService.get(feedCacheId);
  const feed: IFeed = cache ?? {
    hero: [],
    highest_rate: [],
    hot: [],
    updated_recently: []
  } satisfies IFeed;



  if (!cache) {
    try {
      /**
       * Process hero documents
       * TODO: Implement retrieving data from DB
       */
      const heroDocuments = await AnimeRepository.getMany({ id: { $in: conf.StaticData.HomeFeed.hero.map(el => el.id) } });

      feed.hero = heroDocuments.map(el => {
        const hero = conf.StaticData.HomeFeed.hero.find(hero => hero.id === el.id)!;
        const synopsys = el.synopsis_ua ?? el.synopsis_en;

        return {
          id: el.id,
          slug: el.slug,
          title: el.title_ua ?? el.title_en,
          synopsys: synopsys && removeMarkdown(synopsys),
          poster: el.posters.find(el => el.is_hero)?.original ?? el.posters[0]?.original ?? conf.vars.defaultPoster,
          cover: hero.cover,
          video: hero.video,
        };
      });



      /**
       * Process hot documents
       * TODO: Implement retrieving data from DB
       */
      const hotDocuments = await AnimeRepository.getMany({ id: { $in: conf.StaticData.HomeFeed.hot } });

      feed.hot = hotDocuments.map(el => DTOService.toAnimeCard(el));



      // Process rated documents
      const highestRatedDocuments = await AnimeRepository.getSortedMany(undefined, { sort: { score: 'descending' }, limit: 20 });

      feed.highest_rate = highestRatedDocuments.map(el => DTOService.toAnimeCard(el));



      // Process recent documents
      const updatedRecentlyDocuments = await AnimeRepository.getSortedMany(undefined, { sort: { updated_at: 'descending' }, limit: 20 });

      feed.updated_recently = updatedRecentlyDocuments.map(el => DTOService.toAnimeCard(el));



      FeedCacheService.append({
        id: feedCacheId,
        data: feed
      });
    } catch (e) {
      Logger.error(`[HomeFeed]: An error occured while processing home feed`, e);
    }
  }



  return res.status(200).json({
    message: 'Home feed retrieved',
    ...feed
  } satisfies IResponse);
}, { middlewares: ['checkCSRF'] });



const GenericGetHomeFeedRoute = [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];

export default GenericGetHomeFeedRoute;
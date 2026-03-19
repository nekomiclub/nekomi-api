import AnimeRepository from '~/repo/AnimeRepository';
import CacheService from '~/service/CacheService';
import DTS from '~/service/DataTransferService';
import Logger from '~/service/LoggerService';
import conf, { DevelopmentMode } from '~/conf';
import ms from 'ms';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';

import { AnimeMinifiedSchema } from '~/schemas/entities/Anime.schema';
import { HomeFeedHeroSchema, IHomeFeedHero } from '~/schemas/general.schema';
import { Middleware } from '~/service/MiddlewareService';
import { getUTC, removeMarkdown } from '~/utils/utils';



const FeedSchema = z.object({
  hero: HomeFeedHeroSchema.array(),
  hot: AnimeMinifiedSchema.array(),
  highest_rate: AnimeMinifiedSchema.array(),
  updated_recently: AnimeMinifiedSchema.array(),
});

export const GetHomeFeedResponseSchema = FeedSchema.extend({
  message: z.string(),
});



const FeedCache = new CacheService<z.infer<typeof FeedSchema>>('HomeFeed', { ttl: ms('1day') });
const feedCacheId = `~feed`;



/**
 * Get home feed
 * 
 * @test X-HomeFeedCacheUsed will be appended as header to display whether cache was used
 */
const endpoint = HandleRequest(async (req, res) => {
  const cache = FeedCache.get(feedCacheId);
  const feed = cache ?? {
    hero: [],
    highest_rate: [],
    hot: [],
    updated_recently: []
  } satisfies z.infer<typeof FeedSchema>;



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
          title: el.title_ua ?? el.title_en ?? 'Untitled',
          synopsys: synopsys && removeMarkdown(synopsys),
          poster: el.posters.find(el => el.is_hero)?.original ?? el.posters[0]?.original ?? conf.vars.defaultPoster,
          cover: hero.cover,
          video: hero.video,
        } satisfies IHomeFeedHero;
      });



      /**
       * Process hot documents
       * TODO: Implement retrieving data from DB
       */
      const hotDocuments = await AnimeRepository.getMany({ id: { $in: conf.StaticData.HomeFeed.hot } });

      feed.hot = hotDocuments.map(el => DTS.toAnimeMinified(el));



      // Process rated documents
      const highestRatedDocuments = await AnimeRepository.getSortedMany(undefined, { sort: { score: 'descending' }, limit: 20 });

      feed.highest_rate = highestRatedDocuments.map(el => DTS.toAnimeMinified(el));



      // Process recent documents
      const updatedRecentlyDocuments = await AnimeRepository.getSortedMany({ $or: [{ year: getUTC().year }, { year: getUTC().year + 1 }] }, { sort: { updated_at: 'descending' }, limit: 20 });

      feed.updated_recently = updatedRecentlyDocuments.map(el => DTS.toAnimeMinified(el));



      FeedCache.append({
        id: feedCacheId,
        data: feed
      });
    } catch (e) {
      Logger.error(`[HomeFeed]: An error occured while processing home feed`, e);
    }
  }


  // Set testing header
  if (DevelopmentMode) res.setHeader(`X-HomeFeedCacheUsed`, `${Boolean(cache)}`);

  return res.status(200).json({
    message: 'Home feed retrieved',
    ...feed
  } satisfies z.infer<typeof GetHomeFeedResponseSchema>);
}, { middlewares: ['checkCSRF'] });



export default [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];
import AnimeRepository from '~/repo/AnimeRepository.js';
import CacheService from '~/service/CacheService.js';
import DTS from '~/service/DataTransferService.js';
import Logger from '~/service/LoggerService.js';
import conf, { DevelopmentMode } from '~/conf.js';
import ms from 'ms';
import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';

import FeedRepository from 'src/repositories/FeedRepository.js';
import { AnimeMinifiedSchema } from '~/schemas/entities/Anime.schema.js';
import { FeedHydratedSchema, IFeedHydrated } from 'src/schemas/entities/Feed.schema.js';
import { Middleware } from '~/service/MiddlewareService.js';
import { registry } from '~/service/openapi/registry.js';
import { removeMarkdown } from '~/utils/utils.js';



const HomeFeedData = z.object({
  hero: FeedHydratedSchema.array(),
  hot: AnimeMinifiedSchema.array(),
  highest_rate: AnimeMinifiedSchema.array(),
  updated_recently: AnimeMinifiedSchema.array(),
});

const ResponseSchema = CreateResponseSchema(HomeFeedData);



registry.registerPath({
  method: 'get',
  path: '/feed',
  summary: 'Get feed',
  tags: ['Generic Router'],
  request: {},
  responses: {
    200: {
      description: 'Feed retrieved',
      content: {
        'application/json': {
          schema: ResponseSchema,
        }
      }
    }
  }
});



const FeedCache = new CacheService<z.infer<typeof HomeFeedData>>('HomeFeed', { ttl: ms('1day') });
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
  } satisfies z.infer<typeof HomeFeedData>;



  if (!cache) {
    try {
      /** Process hero documents */
      const heroFeedDocuments = await FeedRepository.getMany();
      const heroAnimeDocuments = await AnimeRepository.getMany({ id: { $in: heroFeedDocuments.map(el => el.anime_id) } });

      feed.hero = heroFeedDocuments.map(hero => {
        const anime = heroAnimeDocuments.find(anime => hero.anime_id === anime.id);
        if (!anime) return undefined;

        const synopsys = anime.synopsis_ua ?? anime.synopsis_en;

        return {
          id: anime.id,
          slug: anime.slug,
          title: anime.title_ua ?? anime.title_en ?? 'Untitled',
          synopsys: synopsys && removeMarkdown(synopsys),
          poster: anime.posters.find(el => el.is_hero)?.original ?? anime.posters[0]?.original ?? conf.vars.defaultPoster,
          cover: hero.cover_url,
          video: hero.video_url,
        } satisfies IFeedHydrated;
      }).filter(el => Boolean(el)) as IFeedHydrated[];



      /**
       * Process hot documents
       * 
       * @deprecated
       */
      feed.hot = [];



      // Process rated documents
      const highestRatedDocuments = await AnimeRepository.getSortedMany(undefined, { sort: { score: 'descending' }, limit: 20 });

      feed.highest_rate = highestRatedDocuments.map(el => DTS.toAnimeMinified(el));



      // Process recent documents
      const updatedRecentlyDocuments = await AnimeRepository.getSortedMany({}, { sort: { episodes_synced_at: 'descending' }, limit: 20 });

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

  return res.status(200).json(SendResponse({
    ok: true,
    message: 'Home feed retrieved',
    data: feed
  }, ResponseSchema));
}, { middlewares: ['checkAPIKey'] });



export default EndpointMiddlewares([
  Middleware.CheckAPIKey()
], endpoint);



export const GetHomeFeedRouteSchema = {
  ResponseSchema
};
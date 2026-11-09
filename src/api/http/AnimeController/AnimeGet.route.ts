import z from 'zod';

import conf from '~/conf.js';
import { AnimeDescribedGenres, AnimeDescribedRatings, AnimeNamedSeasons, AnimeNamedStatuses, AnimeNamedTypes } from '~/data/AnimePrimitives.js';
import { AnimeMinifiedSchema, AnimePosterNodeSchema, AnimePublicSchema, AnimeScreenshotNodePublicSchema, IAnimeMinified, IAnimeScreenshotNodePublic } from '~/domain/anime.schema.js';
import { ArgumentTypes, zBoolean } from '~/interfaces/types.js';
import { AnimeRepositoryClass } from '~/repositories/AnimeRepository.js';
import DTS from '~/services/DataTransferService.js';
import { registry } from '~/services/openapi/registry.js';
import { isEligible, isRequesterAPIValid } from '~/utils/auth-utils.js';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';
import { removeMarkdown } from '~/utils/utils.js';

import { AnimeGetEpisodes, AnimeGetEpisodesSchema } from './_utils.js';



/** @see RequestQuerySchema#is_extended */
const AnimeExtendedSchema = z.object({
  posters: AnimePosterNodeSchema.array(),
  relations: AnimeMinifiedSchema.array(),
  screenshots: AnimeScreenshotNodePublicSchema.array()
});

const AnimeDataSchema = z.object({
  anime: AnimePublicSchema,

  /** @see query#is_extended */
  anime_extended: AnimeExtendedSchema.optional(),

  /** @see query#get_episodes */
  anime_episodes: AnimeGetEpisodesSchema.optional()
});



const RequestParamsSchema = z.object({
  qr: z.string().nonempty()
});

const RequestQuerySchema = z.object({
  drop_synopsis_markdown: zBoolean.optional().describe('Drop synopsys makrdown. @default true'),
  is_extended: zBoolean.optional().describe('Get anime business-data (relations, screenshots). @requires Authorization (API Key)'),
  get_episodes: zBoolean.optional().describe('Get anime episodes. @requires Authorization (API Key)'),
});

const ResponseSchema = CreateResponseSchema(AnimeDataSchema);



registry.registerPath({
  method: 'get',
  path: '/anime/{qr}',
  summary: 'Get anime by query',
  tags: ['Anime Router'],
  request: {
    params: RequestParamsSchema,
    query: RequestQuerySchema,
  },
  responses: {
    200: {
      description: 'Anime retrieved',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



/**
 * Get anime document
 */
const endpoint = HandleRequest(async (req, res) => {
  const { qr: query } = RequestParamsSchema.parse(req.params);
  const { drop_synopsis_markdown, is_extended, get_episodes } = RequestQuerySchema.parse(req.query);

  const repo = new AnimeRepositoryClass();
  await repo.init(query);

  let isAPIKeyValid = false;

  const checkAPIKey = async (...args: ArgumentTypes<typeof isRequesterAPIValid>) => { return isAPIKeyValid = await isRequesterAPIValid(...args); };

  let anime: z.infer<typeof AnimeDataSchema.shape.anime>;
  let anime_extended: z.infer<typeof AnimeDataSchema.shape.anime_extended> | undefined;
  let anime_episodes: z.infer<typeof AnimeDataSchema.shape.anime_episodes> | undefined;

  // Append general anime document
  const animeRefined = AnimePublicSchema.parse({
    ...repo.document,
    poster: repo.document.posters.find(el => el.is_hero)?.medium ?? repo.document.posters[0]?.medium ?? conf.variables.default_anime_poster_url,
    genres: repo.document.genres.map(el => AnimeDescribedGenres[el]),
    rating: repo.document.rating && AnimeDescribedRatings[repo.document.rating],
    status: repo.document.status && AnimeNamedStatuses[repo.document.status],
    season: repo.document.season && AnimeNamedSeasons[repo.document.season],
    type: repo.document.type && AnimeNamedTypes[repo.document.type],
  } satisfies z.infer<typeof AnimePublicSchema>);

  // Drop markdown
  if (drop_synopsis_markdown ?? true) {
    if (animeRefined.synopsis_ua) animeRefined.synopsis_ua = removeMarkdown(animeRefined.synopsis_ua);
    if (animeRefined.synopsis_en) animeRefined.synopsis_en = removeMarkdown(animeRefined.synopsis_en);
  }

  anime = animeRefined;

  // Handle is_extended
  if (is_extended && isEligible(`is_extended`, await checkAPIKey(req, isAPIKeyValid))) {
    // Append anime_extended
    const relationsResults = await repo.getMany({ mal_id: { $in: repo.document.relations.map(el => el.mal_id) } });
    const relations: IAnimeMinified[] = relationsResults.map(el => DTS.toAnimeMinified(el));

    const screenshots: IAnimeScreenshotNodePublic[] = repo.document.screenshots.map(el => AnimeScreenshotNodePublicSchema.parse(el));

    anime_extended = AnimeExtendedSchema.parse({
      posters: repo.document.posters,
      relations,
      screenshots
    } satisfies z.infer<typeof AnimeExtendedSchema>);
  }

  // Handle get_episodes
  if (get_episodes && isEligible(`get_episodes`, await checkAPIKey(req, isAPIKeyValid))) {
    anime_episodes = await AnimeGetEpisodes(repo.document);
  }



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'Anime retrieved',
    data: {
      anime,
      anime_extended,
      anime_episodes
    }
  }, ResponseSchema));
});



export default EndpointMiddlewares([], endpoint);



export const AnimeGetRouteSchemas = {
  RequestParamsSchema,
  RequestQuerySchema,
  ResponseSchema,
};
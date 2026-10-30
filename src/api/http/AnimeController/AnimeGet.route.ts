import DTS from '~/service/DataTransferService';
import conf from '~/conf';
import z from 'zod';
import { AnimeDescribedGenres, AnimeDescribedRatings, AnimeDescribedRecord, AnimeNamedRecordSchema, AnimeNamedSeasons, AnimeNamedStatuses, AnimeNamedTypes } from '~/data/AnimePrimitives';
import { AnimeGetEpisodes, AnimeGetEpisodesSchema, AnimeParamsSchema } from './anime-controller-utils';
import { AnimeMinifiedSchema, AnimeSchema, AnimeScreenshotNodePublicSchema, IAnimeMinified, IAnimeScreenshotNodePublic } from '~/schemas/entities/Anime.schema';
import { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import { ArgumentTypes, zBoolean } from '~/intf/types';
import { HandleRequest } from '~/utils/http-utils';
import { asCDNString } from '~/intf/BrandedIds';
import { isEligible, isRequesterCSRF } from '~/utils/auth-utils';
import { removeMarkdown } from '~/utils/utils';



const AnimePublicSchema = AnimeSchema.pick({
  id: true,
  mal_id: true,
  imdb_id: true,
  slug: true,
  hikka_slug: true,
  year: true,
  episodes_total: true,
  episodes_released: true,
  title_en: true,
  title_ja: true,
  title_ua: true,
  title_synonims: true,
  synopsis_en: true,
  synopsis_ua: true,
  score: true,
  scored_by: true,
  studios: true,
  schedule: true,
  is_DMCA_restricted: true,
  updated_at: true,
  created_at: true,
  about_synced_at: true,
  episodes_synced_at: true,
}).extend({
  poster: z.string().transform(asCDNString),
  type: AnimeNamedRecordSchema.nullish(),
  season: AnimeNamedRecordSchema.nullish(),
  status: AnimeNamedRecordSchema.nullish(),
  rating: AnimeDescribedRecord.nullish(),
  genres: AnimeDescribedRecord.array(),
});

/** @see QuerySchema#is_extended */
const AnimeExtendedSchema = z.object({
  relations: AnimeMinifiedSchema.array(),
  screenshots: AnimeScreenshotNodePublicSchema.array()
});



const ParamSchema = AnimeParamsSchema;

const QuerySchema = z.object({
  /** 
   * Drop synopsys makrdown
   * 
   * @default true
   */
  drop_synopsis_markdown: zBoolean.default(true),

  /** 
   * Get anime business-data (relations, screenshots)
   * 
   * @requires Authorization (CSRF)
   */
  is_extended: zBoolean.optional(),

  /** 
   * Get anime episodes
   * 
   * @requires Authorization (CSRF)
   */
  get_episodes: zBoolean.optional(),
});

const ResponseSchema = z.object({
  message: z.string(),
  anime: AnimePublicSchema.or(AnimeMinifiedSchema),

  /** @see QuerySchema#is_extended */
  anime_extended: AnimeExtendedSchema.optional(),

  /** @see QuerySchema#get_episodes */
  anime_episodes: AnimeGetEpisodesSchema.optional()
});



/**
 * Get anime document
 */
const endpoint = HandleRequest(async (req, res) => {
  const { query } = ParamSchema.parse(req.params);
  const { drop_synopsis_markdown, is_extended, get_episodes } = QuerySchema.parse(req.query);

  const repo = new AnimeRepositoryClass();
  await repo.init(query);

  let isCSRFValid = false;

  const isCSRF = async (...args: ArgumentTypes<typeof isRequesterCSRF>) => { return isCSRFValid = await isRequesterCSRF(...args); };

  let anime: z.infer<typeof ResponseSchema.shape.anime>;
  let anime_extended: z.infer<typeof ResponseSchema.shape.anime_extended> | undefined;
  let anime_episodes: z.infer<typeof ResponseSchema.shape.anime_episodes> | undefined;



  // Handle is_extended
  if (is_extended && isEligible(`is_extended`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
    // Append general anime document
    const animeRefined = AnimePublicSchema.parse({
      ...repo.document,
      poster: repo.document.posters.find(el => el.is_hero)?.medium ?? repo.document.posters[0]?.medium ?? conf.vars.defaultPoster,
      genres: repo.document.genres.map(el => AnimeDescribedGenres[el]),
      rating: repo.document.rating && AnimeDescribedRatings[repo.document.rating],
      status: repo.document.status && AnimeNamedStatuses[repo.document.status],
      season: repo.document.season && AnimeNamedSeasons[repo.document.season],
      type: repo.document.type && AnimeNamedTypes[repo.document.type],
    } satisfies z.infer<typeof AnimePublicSchema>);

    // Drop markdown
    if (drop_synopsis_markdown) {
      if (animeRefined.synopsis_ua) animeRefined.synopsis_ua = removeMarkdown(animeRefined.synopsis_ua);
      if (animeRefined.synopsis_en) animeRefined.synopsis_en = removeMarkdown(animeRefined.synopsis_en);
    }

    anime = animeRefined;

    // Append anime_extended
    const relationsResults = await repo.getMany({ mal_id: { $in: repo.document.relations.map(el => el.mal_id) } });
    const relations: IAnimeMinified[] = relationsResults.map(el => DTS.toAnimeMinified(el));

    const screenshots: IAnimeScreenshotNodePublic[] = repo.document.screenshots.map(el => AnimeScreenshotNodePublicSchema.parse(el));

    anime_extended = AnimeExtendedSchema.parse({
      relations,
      screenshots
    } satisfies z.infer<typeof AnimeExtendedSchema>);
  } else anime = DTS.toAnimeMinified(repo.document);

  // Handle get_episodes
  if (get_episodes && isEligible(`get_episodes`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
    anime_episodes = await AnimeGetEpisodes(repo.document);
  }



  return res.status(200).json({
    message: 'Anime retrieved',
    anime,
    anime_extended,
    anime_episodes
  } satisfies z.infer<typeof ResponseSchema>);
});



export default [
  endpoint
];
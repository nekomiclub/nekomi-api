import DTOService from '~/service/DataTransferService';
import IAnime, { AnimeCardType, AnimeGenreType, AnimeGenres, AnimeRateType, AnimeRatings, AnimeSeasonType, AnimeSeasons, AnimeStatusType, AnimeStatuses, AnimeType, AnimeTypes, IAnimeEpisode, IAnimeEpisodeMeta, IAnimePosterNode, IAnimeScreenshotNode } from '~/intf/IAnime';
import Logger from '~/service/LoggerService';
import conf from '~/conf';
import z from 'zod';
import { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import { AshdiAPI } from '~/api/external/ashdi.api';
import { HandleRequest } from '~/utils/http-utils';
import { ISODateString, zBoolean } from '~/intf/types';
import { isEligible, isRequesterCSRF } from '~/utils/auth-utils';
import { removeMarkdown } from '~/utils/utils';



const FullPublicResponseKeys = ['id', 'mal_id', 'imdb_id', 'slug', 'hikka_slug', 'year', 'episodes_total', 'episodes_released', 'title_en', 'title_ja', 'title_ua', 'title_synonims', 'synopsis_en', 'synopsis_ua', 'score', 'scored_by', 'studios', 'schedule', 'is_DMCA_restricted'] as const;
type FullPublicResponseType = Pick<IAnime, typeof FullPublicResponseKeys[number]>

type FullResponseType = FullPublicResponseType & {
  genres: AnimeGenreType[]
  season: AnimeSeasonType | null
  status: AnimeStatusType | null
  rating: AnimeRateType | null
  type: AnimeType | null
}



interface IResponseMisc {
  /** @method get_details */
  relations?: AnimeCardType[]



  /** @method get_episodes */
  episodes?: IAnimeEpisode[]

  /** @method get_episodes */
  episodes_meta?: IAnimeEpisodeMeta[]

  /** @method get_episodes */
  ashdi_url?: string



  /** @method get_details */
  posters?: Omit<IAnimePosterNode, keyof Pick<IAnimePosterNode, '_unprocessedAuthorName' | 'pull_hash'>>[]

  /** @method get_details */
  hero_poster_author?: string | null

  /** @method get_details */
  screenshots?: Omit<IAnimeScreenshotNode, keyof Pick<IAnimeScreenshotNode, 'pull_hash'>>[]



  /** @method get_timestamps */
  updated_at?: ISODateString

  /** @method get_timestamps */
  created_at?: ISODateString

  /** @method get_timestamps */
  hikka_sync?: ISODateString | null

  /** @method get_timestamps */
  myanimelist_sync?: ISODateString | null
}

interface IResponse {
  message: string

  anime: IResponseMisc & (FullResponseType & AnimeCardType | object)
}



const ParamSchema = z.object({
  query: z.string().nonempty()
});

const QuerySchema = z.object({
  view: z.enum(['full', 'card', 'empty']).default('card'),
  get_timestamps: zBoolean.optional(),
  drop_synopsis_markdown: zBoolean.default(true),

  /** @requires Authorization (CSRF) */
  get_details: zBoolean.optional(),

  /** @requires Authorization (CSRF) */
  get_episodes: zBoolean.optional(),
});



/**
 * Get anime document
 */
const endpoint = HandleRequest(async (req, res) => {
  const { query } = ParamSchema.parse(req.params);
  const { view, get_episodes, get_details, get_timestamps, drop_synopsis_markdown } = QuerySchema.parse(req.query);

  const repo = new AnimeRepositoryClass();
  await repo.init(query);

  const anime = repo.document;

  let anime_full: FullResponseType | undefined;
  let anime_card: AnimeCardType | undefined;
  let anime_misc: IResponseMisc = {};



  if (view === 'card') anime_card = DTOService.toAnimeCard(anime);
  else if (view === 'full') {
    anime_full = DTOService.includeKeys(anime, [...FullPublicResponseKeys]);

    anime_full!.synopsis_en = anime.synopsis_en && drop_synopsis_markdown ? removeMarkdown(anime.synopsis_en) : anime.synopsis_en;
    anime_full!.synopsis_ua = anime.synopsis_ua && drop_synopsis_markdown ? removeMarkdown(anime.synopsis_ua) : anime.synopsis_ua;

    anime_full!.genres = anime.genres.map(el => AnimeGenres[el]);
    anime_full!.rating = anime.rating && AnimeRatings[anime.rating];
    anime_full!.status = anime.status && AnimeStatuses[anime.status];
    anime_full!.season = anime.season && AnimeSeasons[anime.season];
    anime_full!.type = anime.type && AnimeTypes[anime.type];
  }

  if (get_details) {
    if (isEligible(`get_details`, await isRequesterCSRF(req, [conf.domains.NEKOMI_DOMAIN]))) {
      anime_misc.hero_poster_author = anime.hero_poster_author;
      anime_misc.screenshots = anime.screenshots.map(el => DTOService.animeScreenshot(el));

      const relations = await repo.getMany({ mal_id: { $in: anime.relations.map(el => el.mal_id) } });
      anime_misc.relations = relations.map(el => DTOService.toAnimeCard(el));

      if (anime.posters.length) {
        anime_misc.posters = anime.posters.map(el => DTOService.animePoster(el));
      } else {
        anime_misc.posters = [{
          authorId: conf.vars.INTERNAL_ID,
          is_hero: true,
          original: conf.vars.defaultPoster,
          medium: conf.vars.defaultPoster,
          small: conf.vars.defaultPoster,
        }];
      }
    }
  }

  if (get_episodes) {
    if (isEligible(`get_episodes`, await isRequesterCSRF(req, [conf.domains.NEKOMI_DOMAIN]))) {
      anime_misc.episodes = anime.episodes;
      anime_misc.episodes_meta = anime.episodes_meta;

      if (anime.imdb_id) {
        try {
          const ashdi = await AshdiAPI.getTitle({ imdbId: anime.imdb_id });
          anime_misc.ashdi_url = ashdi.url;
        } catch (e) {
          Logger.warn(`[AnimeGet.route]: An error occured while retrieving ashdi title`, e);
        }
      }
    }
  }

  if (get_timestamps) {
    anime_misc.created_at = anime.created_at;
    anime_misc.updated_at = anime.updated_at;
    anime_misc.hikka_sync = anime.hikka_sync;
    anime_misc.myanimelist_sync = anime.myanimelist_sync;
  }



  return res.status(200).json({
    message: 'Anime retrieved',
    anime: {
      ...anime_full,
      ...anime_card,
      ...anime_misc
    }
  } satisfies IResponse);
});



const AnimeGetRoute = [
  endpoint
];

export default AnimeGetRoute;
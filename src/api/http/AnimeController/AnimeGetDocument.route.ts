import DTOService from '~/service/DataTransferService';
import IAnime, { AnimeCardType, AnimeGenreType, AnimeGenres, AnimeRateType, AnimeRatings, AnimeSeasonType, AnimeSeasons, AnimeStatusType, AnimeStatuses, AnimeType, AnimeTypes } from '~/intf/IAnime';
import conf from '~/config';
import z from 'zod';
import { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import { HandleRequest } from '~/utils/http-utils';
import { isEligible, isRequesterCSRF } from '~/utils/auth-utils';
import { removeMarkdown } from '~/utils/utils';
import { zBoolean } from '~/intf/types';



type PublicAnimeKeysType = keyof Pick<IAnime, 'id'
  | 'mal_id'
  | 'imdb_id'
  | 'slug'
  | 'hikka_slug'
  | 'year'
  | 'episodes_total'
  | 'episodes_released'
  | 'title_en'
  | 'title_ja'
  | 'title_ua'
  | 'title_synonims'
  | 'synopsis_en'
  | 'synopsis_ua'
  | 'score'
  | 'scored_by'
  | 'studios'
  | 'schedule'
  | 'is_DMCA_restricted'>

type ProtectedAnimeKeysType = keyof Pick<IAnime, 'posters'
  | 'hero_poster_author'
  | 'screenshots'
  | 'episodes'
  | 'episodes_meta'
  | 'updated_at'
  | 'created_at'
  | 'hikka_sync'
  | 'myanimelist_sync'>

type AnimeFullType = Pick<IAnime, PublicAnimeKeysType> & {
  genres: AnimeGenreType[]
  season: AnimeSeasonType | null
  status: AnimeStatusType | null
  rating: AnimeRateType | null
  type: AnimeType | null
}

/** @method get_details, get_episodes */
type AnimeMiscType = Partial<Pick<IAnime, ProtectedAnimeKeysType>> & {
  relations?: AnimeCardType[]
}

interface IResponse {
  message: string

  anime_full: AnimeFullType | undefined
  anime_card: AnimeCardType | undefined
  anime_misc: AnimeMiscType | undefined
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

  let anime_full: AnimeFullType | undefined;
  let anime_card: AnimeCardType | undefined;
  let anime_misc: AnimeMiscType = {};



  if (view === 'card') anime_card = DTOService.toAnimeCard(anime);
  else if (view === 'full') {
    anime_full = {
      id: anime.id,
      mal_id: anime.mal_id,
      imdb_id: anime.imdb_id,
      slug: anime.slug,
      hikka_slug: anime.hikka_slug,

      year: anime.year,
      episodes_total: anime.episodes_total,
      episodes_released: anime.episodes_released,

      title_en: anime.title_en,
      title_ja: anime.title_ja,
      title_ua: anime.title_ua,
      title_synonims: anime.title_synonims,

      synopsis_en: anime.synopsis_en && drop_synopsis_markdown ? removeMarkdown(anime.synopsis_en) : anime.synopsis_en,
      synopsis_ua: anime.synopsis_ua && drop_synopsis_markdown ? removeMarkdown(anime.synopsis_ua) : anime.synopsis_ua,

      score: anime.score,
      scored_by: anime.scored_by,

      studios: anime.studios,
      schedule: anime.schedule,

      genres: anime.genres.map(el => AnimeGenres[el]),
      rating: anime.rating && AnimeRatings[anime.rating],
      status: anime.status && AnimeStatuses[anime.status],
      season: anime.season && AnimeSeasons[anime.season],
      type: anime.type && AnimeTypes[anime.type],

      is_DMCA_restricted: anime.is_DMCA_restricted,
    };
  }

  if (get_details) {
    if (isEligible(`get_details`, await isRequesterCSRF(req, [conf.domains.NEKOMI_DOMAIN]))) {
      anime_misc.posters = anime.posters.map(el => DTOService.animePoster(el));
      anime_misc.hero_poster_author = anime.hero_poster_author;
      anime_misc.screenshots = anime.screenshots.map(el => DTOService.animeScreenshot(el));

      const relations = await repo.getMany({ mal_id: { $in: anime.relations.map(el => el.mal_id) } });
      anime_misc.relations = relations.map(el => DTOService.toAnimeCard(el));
    }
  }

  if (get_episodes) {
    if (isEligible(`get_episodes`, await isRequesterCSRF(req, [conf.domains.NEKOMI_DOMAIN]))) {
      anime_misc.episodes = anime.episodes;
      anime_misc.episodes_meta = anime.episodes_meta;
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
    anime_full,
    anime_card,
    anime_misc: Object.keys(anime_misc).length ? anime_misc : undefined
  } satisfies IResponse);
});



const AnimeGetDocumentRoute = [
  endpoint
];

export default AnimeGetDocumentRoute;
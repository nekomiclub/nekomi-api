import DTOService from '~/service/DataTransferService';
import IAnime, { AnimeCardType, AnimeGenreType, AnimeGenres, AnimeRateType, AnimeRatings, AnimeSeasonType, AnimeSeasons, AnimeStatusType, AnimeStatuses, AnimeType, AnimeTypes, IAnimeEpisode, IAnimePlayer, IAnimePosterNode, IAnimeScreenshotNode } from '~/intf/IAnime';
import TeamRepository from '~/repo/TeamRepository';
import conf from '~/conf';
import z from 'zod';
import { AnimeRepositoryClass, DefaultAnimePoster } from '~/repo/AnimeRepository';
import { ArgumentTypes, ISODateString, zBoolean } from '~/intf/types';
import { HandleRequest } from '~/utils/http-utils';
import { TeamCardType } from '~/intf/ITeam';
import { TeamId } from '~/intf/BrandedIds';
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

  poster: Omit<IAnimePosterNode, keyof Pick<IAnimePosterNode, '_unprocessedAuthorName' | 'pull_hash'>>
}



interface IResponseMisc {
  /** @method get_episodes */
  player?: IAnimePlayer

  /** @method get_episodes */
  player_teams?: TeamCardType[]

  /** @method get_episodes */
  episodes_meta?: IAnimeEpisode[]

  /** @method get_episodes */
  ashdi_url?: string | null



  /** @method get_details */
  relations?: AnimeCardType[]

  /** @method get_details */
  screenshots?: Omit<IAnimeScreenshotNode, keyof Pick<IAnimeScreenshotNode, 'pull_hash'>>[]



  /** @method get_timestamps */
  updated_at?: ISODateString

  /** @method get_timestamps */
  created_at?: ISODateString

  /** @method get_timestamps */
  about_synced_at?: ISODateString | null

  /** @method get_timestamps */
  episodes_synced_at?: ISODateString | null
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

  let isCSRFValid = false;

  const isCSRF = async (...args: ArgumentTypes<typeof isRequesterCSRF>) => { return isCSRFValid = await isRequesterCSRF(...args); };

  let anime_full: FullResponseType | undefined;
  let anime_card: AnimeCardType | undefined;
  let anime_misc: IResponseMisc = {};



  if (view === 'card') anime_card = DTOService.toAnimeCard(anime);
  else if (view === 'full') {
    anime_full = DTOService.includeKeys(anime, [...FullPublicResponseKeys]) as FullResponseType;

    anime_full.synopsis_en = anime.synopsis_en && drop_synopsis_markdown ? removeMarkdown(anime.synopsis_en) : anime.synopsis_en;
    anime_full.synopsis_ua = anime.synopsis_ua && drop_synopsis_markdown ? removeMarkdown(anime.synopsis_ua) : anime.synopsis_ua;

    anime_full.genres = anime.genres.map(el => AnimeGenres[el]);
    anime_full.rating = anime.rating && AnimeRatings[anime.rating];
    anime_full.status = anime.status && AnimeStatuses[anime.status];
    anime_full.season = anime.season && AnimeSeasons[anime.season];
    anime_full.type = anime.type && AnimeTypes[anime.type];

    anime_full.poster = DTOService.animePoster(anime.posters.find(el => el.is_hero) ?? anime.posters[0] ?? DefaultAnimePoster);
  }

  if (get_details) {
    if (isEligible(`get_details`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
      anime_misc.screenshots = anime.screenshots.map(el => DTOService.animeScreenshot(el));

      const relations = await repo.getMany({ mal_id: { $in: anime.relations.map(el => el.mal_id) } });
      anime_misc.relations = relations.map(el => DTOService.toAnimeCard(el));
    }
  }

  if (get_episodes) {
    if (isEligible(`get_episodes`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
      const playerTeamsIds = new Set<TeamId>();

      anime.player.dubbed.forEach(team => team.dubber_ids.forEach(id => playerTeamsIds.add(id)));
      anime.player.subbed.forEach(team => team.dubber_ids.forEach(id => playerTeamsIds.add(id)));

      const playerTeams = await TeamRepository.getMany({ id: { $in: Array.from(playerTeamsIds) } });



      anime_misc.player = anime.player;
      anime_misc.player_teams = playerTeams.map(el => DTOService.toTeamCard(el));
      anime_misc.episodes_meta = anime.episodes_meta;
      anime_misc.ashdi_url = anime.ashdi_url;
    }
  }

  if (get_timestamps) {
    anime_misc.created_at = anime.created_at;
    anime_misc.updated_at = anime.updated_at;
    anime_misc.about_synced_at = anime.about_synced_at;
    anime_misc.episodes_synced_at = anime.episodes_synced_at;
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
import Anime, { ANIME_GENRES, ANIME_MEDIA_TYPES, ANIME_RATES, ANIME_SEASONS, HydratedAnime } from '~/core/interfaces/AnimeIntf';



export function HydrateAnimeDocument(anime: Anime): HydratedAnime {
  return {
    anime,
    genres: anime.genres.map(slug => ANIME_GENRES[slug]),
    media: ANIME_MEDIA_TYPES[anime.media],
    rate: ANIME_RATES[anime.rate],
    season: ANIME_SEASONS[anime.season]
  };
}
import Anime, { ANIME_GENRE, ANIME_GENRES, ANIME_MEDIA_TYPES, ANIME_RATES, ANIME_SEASONS, ANIME_STATUSES, AnimeStudio, HydratedAnime } from '~/core/interfaces/Anime.intf';
import Dubber, { DubberCompact } from '~/core/interfaces/Dubber.intf';
import { MyAnimeListNode } from '~/core/interfaces/types';



export function DubberCompactMapper(dubber: Dubber): DubberCompact {
  return {
    id: dubber.id,
    avatarURL: dubber.avatar,
    nameEng: dubber.nameEng,
    nameUkr: dubber.nameUkr,
    slug: dubber.slug
  };
}



export function HydrateAnimeDocument(anime: Anime): HydratedAnime {
  return {
    anime,
    genres: anime.genres.map(slug => ANIME_GENRES[slug]),
    media: ANIME_MEDIA_TYPES[anime.media],
    rate: ANIME_RATES[anime.rate],
    season: ANIME_SEASONS[anime.season],
    status: ANIME_STATUSES[anime.status]
  };
}



/** Parse MyAnimeList genres into ANIME_GENRE[] */
export function MALGenres(input?: MyAnimeListNode['genres']): ANIME_GENRE[] {
  const genres: ANIME_GENRE[] = [];

  input?.forEach(genre => {
    if (Object.values(ANIME_GENRE).includes(genre.name.toLowerCase() as ANIME_GENRE)) genres.push(genre.name.toLowerCase() as ANIME_GENRE);
  });

  return genres;
}



/** Parse MyAnimeList studios into AnimeStudio[] */
export function MALStudios(input: MyAnimeListNode['studios']): AnimeStudio[] {
  return input?.map(studio => {
    return {
      malId: studio.id,
      name: studio.name
    };
  }) ?? [];
}


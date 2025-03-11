import { ANIME_GENRE } from '~/core/interfaces/AnimeIntf';
import { MyAnimeListNode } from '~/core/interfaces/types';

export function MALGenres(input?: MyAnimeListNode['genres']) {
  const genres: ANIME_GENRE[] = [];

  input?.forEach(genre => {
    if (Object.values(ANIME_GENRE).includes(genre.name.toLowerCase() as ANIME_GENRE)) genres.push(genre.name.toLowerCase() as ANIME_GENRE);
  });

  return genres;
}
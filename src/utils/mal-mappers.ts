import { ANIME_GENRE, AnimeStudio } from '~/core/interfaces/AnimeIntf';
import { MyAnimeListNode } from '~/core/interfaces/types';



export function MALGenres(input?: MyAnimeListNode['genres']): ANIME_GENRE[] {
  const genres: ANIME_GENRE[] = [];

  input?.forEach(genre => {
    if (Object.values(ANIME_GENRE).includes(genre.name.toLowerCase() as ANIME_GENRE)) genres.push(genre.name.toLowerCase() as ANIME_GENRE);
  });

  return genres;
}

export function MALStudios(input: MyAnimeListNode['studios']): AnimeStudio[] {
  return input?.map(studio => {
    return {
      malId: studio.id,
      name: studio.name
    };
  }) ?? [];
}
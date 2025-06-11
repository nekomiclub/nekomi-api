import Anime, { ANIME_GENRE, ANIME_GENRES, ANIME_MEDIA_TYPES, ANIME_RATES, ANIME_SEASONS, ANIME_STATUSES, AnimeStudio, HydratedAnime } from '~/core/interfaces/Anime.intf';
import Dubber, { DubberCompact } from '~/core/interfaces/Dubber.intf';
import { Metadata, MyAnimeListNode } from '~/core/interfaces/types';
import { User } from '~/core/interfaces/User.intf';



export function DubberCompactMapper(dubber: Dubber): DubberCompact {
  return {
    id: dubber.id,
    avatarURL: dubber.avatar,
    nameEng: dubber.nameEng,
    nameUkr: dubber.nameUkr,
    slug: dubber.slug
  };
}



export function DubberMetadataMapper(dubber: Dubber): Metadata {
  return {
    title: dubber.nameUkr,
    description: dubber.description ?? 'Ця команда озвучує аніме на nekomi.club',
    keywords: [dubber.nameUkr, dubber.nameEng],
    photo: dubber.avatar
  };
}

export function AnimeMetadataMapper(anime: Anime): Metadata {
  const genres = anime.genres.map(slug => ANIME_GENRES[slug]);
  const media = ANIME_MEDIA_TYPES[anime.media];

  return {
    title: `Аніме ${anime.names.ukr} (${anime.year})`,
    description: `${genres.map(el => el.name).join(', ')} • ${anime.year} • ${media.name}. ${anime.description}`,
    keywords: [anime.names.ukr, anime.names.eng, ...anime.names.alt],
    photo: anime.poster
  };
}

export function UserMetadataMapper(user: User): Metadata {
  return {
    title: `@${user.username}`,
    description: `Профіль користувача`,
    keywords: [user.username],
    photo: user.avatar
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


import Anime, { ANIME_GENRES, ANIME_MEDIA_TYPES, ANIME_RATES, ANIME_SEASONS, ANIME_STATUSES, HydratedAnime } from '~/core/interfaces/Anime.intf';
import IDubber, { DubberCompact } from '~/core/interfaces/Dubber.intf';
import { IUser } from '~/core/interfaces/User.intf';
import { Metadata } from '~/core/interfaces/types';



export function DubberCompactMapper(dubber: IDubber): DubberCompact {
  return {
    id: dubber.id,
    avatarURL: dubber.avatar,
    nameEng: dubber.nameEng,
    nameUkr: dubber.nameUkr,
    slug: dubber.slug
  };
}



export function DubberMetadataMapper(dubber: IDubber): Metadata {
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

export function UserMetadataMapper(user: IUser): Metadata {
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
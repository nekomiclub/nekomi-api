import Anime, { ANIME_GENRES, ANIME_MEDIA_TYPES, AnimeMetadata, AnimeRelated } from '~/core/interfaces/AnimeIntf';
import IDubber, { DubberMetadata } from '~/core/interfaces/DubberIntf';

export function DubberMetadataMapper(dubber: IDubber): DubberMetadata {
  return {
    id: dubber.id,
    avatarURL: dubber.avatar,
    nameEng: dubber.nameEng,
    nameUkr: dubber.nameUkr,
    slug: dubber.slug
  };
}

export function AnimeMetadataMapper(anime: Anime): AnimeMetadata {
  const genres = anime.genresNew.map(slug => ANIME_GENRES[slug]);
  const media = ANIME_MEDIA_TYPES[anime.media];

  return {
    title: `Аніме ${anime.names.ukr} (${anime.year})`,
    description: `${genres.map(el => el.name).join(', ')} • ${anime.year} • ${media.name}. ${anime.description}`,
    keywords: [anime.names.ukr, anime.names.eng, ...anime.names.alt],
    photo: anime.poster
  };
}

export function AnimeRelatedMapper(anime: Anime): AnimeRelated {
  return {
    uuid: anime.uuid,
    slug: anime.slug,
    episodesCount: anime.episodesCount,
    genres: anime.genresNew.map(slug => ANIME_GENRES[slug]),
    malScore: anime.score.mal,
    nameUkr: anime.names.ukr,
    posterURL: anime.poster
  };
}
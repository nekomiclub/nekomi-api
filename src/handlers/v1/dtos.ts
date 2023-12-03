import { IDubber, ITitle } from '../../core/interfaces';

export function title({ id, ageRate, backgroundURL, code, country, description, dubs, ended, epsMeta, estimatedEps, genres, linkedManga, linkedTitlesIDs, names, posterURL, rating, season, started, status, studios, type, year }: ITitle): ITitle {
  return { id, ageRate, backgroundURL, code, country, description, dubs, ended, epsMeta, estimatedEps, genres, linkedManga, linkedTitlesIDs, names, posterURL, rating, season, started, status, studios, type, year };
}

export function dubber({ code, id, name, thumbURL }: IDubber): IDubber {
  return { code, id, name, thumbURL };
}
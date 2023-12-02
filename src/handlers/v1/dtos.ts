import { ITitle } from '../../core/interfaces';

export function convertTitle({ id, ageRate, backgroundURL, code, country, description, dubs, ended, epsMeta, estimatedEps, genres, linkedManga, linkedTitlesIDs, names, posterURL, rating, season, started, status, studios, type, year }: ITitle): ITitle {
  return { id, ageRate, backgroundURL, code, country, description, dubs, ended, epsMeta, estimatedEps, genres, linkedManga, linkedTitlesIDs, names, posterURL, rating, season, started, status, studios, type, year };
}
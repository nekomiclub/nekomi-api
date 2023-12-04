import { IStorageItem } from 'src/core/interfaces';
import { IDubber, ITitle } from '../../core/interfaces';

export function title({ id, ageRate, background, code, country, description, dubs, ended, epsMeta, estimatedEps, genres, linkedManga, linkedTitlesIDs, names, poster, rating, season, started, status, studios, type, year }: ITitle): ITitle {
  return { id, ageRate, background, code, country, description, dubs, ended, epsMeta, estimatedEps, genres, linkedManga, linkedTitlesIDs, names, poster, rating, season, started, status, studios, type, year };
}

export function dubber({ code, id, name, thumbURL }: IDubber): IDubber {
  return { code, id, name, thumbURL };
}

export function storageItem({ URI, dateAdded, id }: IStorageItem): IStorageItem {
  return { dateAdded, id, URI };
}
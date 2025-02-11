import { convert as convertSlug } from 'url-slug';

export function createSlug(input: string) {
  return convertSlug(input, {
    camelCase: true,
    separator: '-'
  });
}
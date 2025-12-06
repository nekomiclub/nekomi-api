import { convert as convertSlug } from 'url-slug';



/** 
 * Create slug from string
 * 
 * @example "Solo | Leveling 2" > "solo-leveling-2"
 */
export default function createSlug(str: string) {
  return convertSlug(str, {
    camelCase: true,
    separator: '-'
  });
}
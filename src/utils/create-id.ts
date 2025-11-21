import { nanoid } from 'nanoid';



/** 
 * Create ID
 * 
 * @param length id length. Default - 8
 */
export default function createId(length?: number) {
  return nanoid(length ?? 8).replaceAll('_', 'u').replaceAll('-', 'd');
}
import * as uuid from 'uuid';
import { nanoid } from 'nanoid';



/** 
 * Create ID
 * 
 * @param length id length. @default 8
 */
export default function createId(length?: number) {
  return nanoid(length ?? 8).replaceAll('_', 'u').replaceAll('-', 'd');
}

export function createUUID() {
  return uuid.v4();
}
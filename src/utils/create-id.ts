import * as uuid from 'uuid';
import { nanoid } from 'nanoid';



/** 
 * Create UUID
 */
export default function createId() {
  return uuid.v4();
}

/** Create tiny id */
export function createNanoId(length?: number) {
  return nanoid(length ?? 8).replaceAll('_', 'u').replaceAll('-', 'd');
}
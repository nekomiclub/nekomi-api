import { nanoid } from 'nanoid';



/** Create ID */
export default function createId() {
  return nanoid(8).replaceAll('_', 'u');
}
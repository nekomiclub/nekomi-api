import Storage from '../../Models/Storage';
import { convert } from './convert';

export async function process(id: string) {
  await convert(id, 'webm');
  const item = await Storage.findOne({ $where: id });

  console.log(item);
}
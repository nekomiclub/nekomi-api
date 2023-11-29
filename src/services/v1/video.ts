import Storage from '../../Models/Storage';
import { E400 } from '../../handlers/v1/Errors';
import { convertMedia } from './convert';

interface IProcessReponse {
  q2k: string | null,
  q1080: string,
  q480: string,
  q240: string
}

export async function process(id: string): Promise<IProcessReponse> {
  await convertMedia(id, 'webm');
  const item = await Storage.findOne({ $where: id });

  if (!item) {
    throw new E400('Video processor can not find item with provided id in storage.');
  }

  console.log(item);
  return {
    q2k: null,
    q1080: `${id}:quality:1080`,
    q480: `${id}:quality:480`,
    q240: `${id}:quality:240`
  };
}
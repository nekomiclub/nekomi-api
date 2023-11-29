import Storage from '../../Models/Storage';
import { E400 } from '../../handlers/v1/Errors';

export async function convertMedia(id: string, to: 'webp' | 'webm'): Promise<string> {
  const item = await Storage.findOne({ id });

  if (!item) {
    throw new E400('Media converter can not find item with provided id in storage.');
  }

  if (to === 'webm') {
    //
  } else if (to === 'webp') {
    //
  }

  return id;
}
import { TUpload } from '../../core/IUpload';
import Storage from '../../Models/Storage';
import { ErrorConstructor, E400, writeErrorLog, E500 } from '../../handlers/v1/Errors';
import { IStorageItem } from '../../core/interfaces';
import fs from 'fs';
import path from 'path';
import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import ffmpeg from 'fluent-ffmpeg';
import { getVideoDurationInSeconds } from 'get-video-duration';
import { getFreeDiskURI, store } from './storage';
import sharp from 'sharp';

export async function checkConditions(id: string) {
  const item = await Storage.findOne({ id });

  if (!item) {
    throw new E400('Item with provided id is not found in storage.');
  }

  // Check if disk have enought capacity
  await getFreeDiskURI(fs.statSync(item.URI).size * 3);
}



export async function processPhoto(id: string, type: TUpload) {
  const item = await Storage.findOne({ id });

  if (!item) {
    throw new E400('Item with provided id is not found in storage.');
  }

  //! ConvertWebp func will remove file without updating it`s URI in storage. Untill URI will be replaced (cropAvatar/enchancePoster) current URI will be unaccesible. Use croppedURI instead 
  const croppedURI = await convertWebp(id, item);

  if (!fs.existsSync(`${path.resolve()}/tmp/processing/raw`)) {
    fs.mkdirSync(`${path.resolve()}/tmp/processing/raw`);
  }

  let readyURI = '';

  if (type === 'photo/user/avatar') {
    readyURI = await cropAvatar(id, croppedURI);
  } else if (type === 'photo/series') {
    readyURI = await enchancePoster(id, croppedURI);
  }

  item.URI = readyURI;

  await item.save();
  await store(id);
}

async function convertWebp(id: string, item: IStorageItem): Promise<string> {
  const croppedDest = `${path.resolve()}/tmp/processing/raw`;
  let croppedURI = `${croppedDest}/${id}.webp`;

  await imagemin([item.URI], {
    destination: croppedDest,
    plugins: [
      imageminWebp()
    ]
  });

  fs.rmSync(item.URI);

  return croppedURI;
}

async function cropAvatar(id: string, URI: string): Promise<string> {
  const croppedDest = `${path.resolve()}/tmp/processing`;
  let croppedURI = `${croppedDest}/${id}.webp`;

  await imagemin([URI], {
    destination: croppedDest,
    plugins: [
      imageminWebp({
        resize: {
          height: 128,
          width: 128
        }
      })
    ]
  });

  fs.rmSync(URI);
  const item = await Storage.findOne({ id });

  item!.URI = croppedURI;
  await item!.save();

  return croppedURI;
}

async function enchancePoster(id: string, URI: string): Promise<string> {
  const destURI = `${path.resolve()}/tmp/processing/${id}.webp`;
  fs.copyFileSync(URI, destURI);
  fs.rmSync(URI);
  const item = await Storage.findOne({ id });

  item!.URI = destURI;
  await item!.save();

  return destURI;
}



export async function processVideo(id: string) {
  const item = await Storage.findOne({ id });

  if (!item) {
    throw new E400('Item with provided id is not found in storage.');
  }

  await convertWebm(id, item);
  await new Promise(res => {
    setTimeout(() => {
      res(1);
    }, 1000);
  });
  const sourceURI = await store(id);
  createPreview(id, sourceURI);
  cropWebm(id, sourceURI, 720);
  cropWebm(id, sourceURI, 480);
  cropWebm(id, sourceURI, 240);
}

async function convertWebm(id: string, item: IStorageItem): Promise<string> {
  const outURI = `${path.resolve()}/tmp/processing/${id}.webm`;
  const startDate = +new Date();
  console.log(`Started converting video with id ${id} to webm.`);

  await new Promise(res => {
    ffmpeg(item.URI)
      .videoCodec('libvpx') // libvpx-vp9 could be used too
      .videoBitrate(1000, true)
      .outputOptions(
        '-minrate', '1000',
        '-maxrate', '1000',
        '-threads', '4', //Use number of real cores available on the computer - 1
        '-flags', '+global_header')
      .on('error', e => {
        console.log('Video processed with error');
        console.error(e);
        // @ts-ignore
        writeErrorLog(`Service throw an error while processing ${id}: ${e.msg}`, 'services/v1/processMedia.ts/convertWebm');
      })
      .on('end', async () => {
        console.log(`Video with id ${id} converting to webm finished! (${+new Date() - startDate}ms)`);

        fs.rmSync(item.URI);
        const db = await Storage.findOne({ id });

        db!.URI = outURI;
        await db!.save();

        res(1);
      })
      .save(outURI);
  });

  return outURI;
}

async function cropWebm(id: string, sourceURI: string, quality: 1440 | 720 | 480 | 240): Promise<string> {
  id = `${id}_q_${quality}`;
  const startDate = +new Date();
  const outURI = `${path.resolve()}/tmp/processing/${id}.webm`;

  ffmpeg(sourceURI)
    .videoCodec('libvpx') // libvpx-vp9 could be used too
    .videoBitrate(1000, true)
    .size(`${quality}x?`)
    .aspect('16:9')
    .outputOptions(
      '-minrate', '1000',
      '-maxrate', '1000',
      '-threads', '4', //Use number of real cores available on the computer - 1
      '-flags', '+global_header')
    .on('error', e => {
      console.log('Video processed with error');
      console.error(e);
      // @ts-ignore
      writeErrorLog(`Service throw an error while processing ${id}: ${e.msg}`, 'services/v1/processMedia.ts/convertWebm');
    })
    .on('end', async () => {
      console.log(`Video with id ${id} cropping to ${quality} finished! (${+new Date() - startDate}ms)`);
      const item = new Storage({
        id,
        URI: outURI,
        dateAdded: +new Date()
      });

      await item.save();

      await new Promise(res => {
        res(1);
      });

      await store(id);
    })
    .save(outURI);

  return id;
}

async function createPreview(id: string, sourceURI: string) {
  const duration = await getVideoDurationInSeconds(sourceURI);
  const previews = Math.ceil(duration / 5);
  const frames = Math.ceil(previews / 10); // TODO: test only (must be 25)

  const tempFolder = `${path.resolve()}/tmp/processing/raw/${id}`;
  const previewsFolder = `${tempFolder}/previews`;
  const framesFolder = `${tempFolder}/frames`;

  if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder);
  }

  if (!fs.existsSync(previewsFolder)) {
    fs.mkdirSync(previewsFolder);
  }

  if (!fs.existsSync(framesFolder)) {
    fs.mkdirSync(framesFolder);
  }

  await cropPreviews(sourceURI, previews, previewsFolder);
  await createFrames(id, previewsFolder, framesFolder);

  fs.rmSync(tempFolder, { recursive: true });
}

async function cropPreviews(sourceURI: string, previews: number, previewsFolder: string) {
  return await new Promise(res => {
    ffmpeg(sourceURI)
      .screenshots({
        count: previews,
        size: '320x240',
        filename: '%s.webp',
        folder: previewsFolder
      })
      .on('end', () => {
        res(1);
      });
  });
}

async function createFrames(id: string, previewsFolder: string, framesFolder: string) {
  const previews = fs.readdirSync(previewsFolder);

  previews.sort((a: string, b: string) => {
    const numA: number = parseFloat(a.split('.')[0]);
    const numB: number = parseFloat(b.split('.')[0]);
    return numB - numA;
  });

  let previewNow = 0;
  const picsArr: string[][] = [];
  let picsArrTemp: string[] = [];

  previews.forEach(preview => {
    if (previewNow === 10) { // TODO: test only (must be 25)
      previewNow = 0;

      picsArr.push(picsArrTemp);
      picsArrTemp = [];

      previewNow++;
      picsArrTemp.push(`${previewsFolder}/${preview}`);
    } else {
      previewNow++;
      picsArrTemp.push(`${previewsFolder}/${preview}`);
    }
  });

  picsArr.push(picsArrTemp);
  picsArrTemp = [];

  sharp.cache(false);

  const framesIDsArr: string[] = [];

  for (const picI in picsArr) {
    const picArr = picsArr[picI];
    const outURI = `${framesFolder}/${id}_f_${picI}.webp`;

    const layer = sharp({
      create: {
        width: 320 * picArr.length,
        height: 240,
        channels: 3,
        background: '#000'
      }
    });

    layer.composite(picArr.map((pic, i) => {
      return {
        input: pic,
        left: i * 320,
        top: 0
      };
    }));

    const uid = `${id}_f_${picI}`;

    layer.toFile(outURI);
    framesIDsArr.push(uid);

    const item = new Storage({
      id: uid,
      URI: outURI,
      dateAdded: +new Date()
    });

    await item.save();
  }

  await new Promise(res => {
    setTimeout(() => {
      res(1);
    }, framesIDsArr.length * 500);
  });

  for (const i in framesIDsArr) {
    const frameId = framesIDsArr[i];
    await store(frameId);
  }
}
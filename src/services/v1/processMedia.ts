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
import { devMode } from '../../config';
import * as dto from '../../handlers/v1/dtos';

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



export type TPVQuality = 240 | 480 | 720 | 1080 | 1440;

export async function processVideo(id: string, quality: TPVQuality[]) {
  const startedAt = +new Date();
  const item = await Storage.findOne({ id });
  const TID = (Math.random() + 1).toString(36).substring(8);

  try {
    const sourceURI = await convertWebm(id, TID, dto.storageItem(item!));

    createPreview(id, TID, sourceURI);
    await Promise.all([
      (quality.includes(720)) ? cropWebm(id, TID, sourceURI, 720) : '',
      (quality.includes(480)) ? cropWebm(id, TID, sourceURI, 480) : '',
      (quality.includes(240)) ? cropWebm(id, TID, sourceURI, 240) : '',
    ]);

    await store(id);

    fs.rmSync(`${path.resolve()}/tmp/processing/${TID}`, { recursive: true });
    console.log(`Video processing finished!\nID: ${id}\nWithin: ${(+new Date() - startedAt) / 1000}s`);
  } catch (e) {
    writeErrorLog(`Service throw an error: ${JSON.stringify(e)}. Reverting...`, 'services/v1/processMedia.ts/processVideo');

    if (!devMode) {
      return;
    }

    console.error(e);
  }
}

async function convertWebm(id: string, TID: string, item: IStorageItem): Promise<string> {
  const outFolder = `${path.resolve()}/tmp/processing/${TID}`;
  const outURI = `${outFolder}/${id}.webm`;
  const sourceURI = item.URI;
  const startTS = +new Date();

  if (!fs.existsSync(outFolder)) fs.mkdirSync(outFolder);
  if (devMode) console.log(`Start compressing video to webm with TID: ${TID}`);

  await new Promise((res, rej) => {
    ffmpeg(sourceURI)
      .videoCodec('libvpx')
      .on('error', e => {
        rej(e);
      })
      .on('progress', progress => {
        if (devMode) console.log(`Ready: ${progress.percent}`);
      })
      .on('end', () => {
        res(1);
      })
      .saveToFile(outURI);
  });

  fs.rmSync(item.URI);

  const db = await Storage.findOne({ id });
  db!.URI = outURI;

  await db!.save();

  if (devMode) console.log(`Compressing video with TID ${TID} ended within ${(+new Date() - startTS) / 1000}s`);

  return outURI;
}

export async function cropWebm(id: string, TID: string, sourceURI: string, quality: TPVQuality): Promise<string> {
  const outFolder = `${path.resolve()}/tmp/processing/${TID}`;
  const outURI = `${outFolder}/${id}_q_${quality}.webm`;
  const startTS = +new Date();

  if (!fs.existsSync(outFolder)) fs.mkdirSync(outFolder);
  if (devMode) console.log(`Start cropping video to ${quality} with TID: ${TID}`);

  fs.writeFileSync(outURI, '');

  await new Promise((res, rej) => {
    ffmpeg(sourceURI)
      .inputOptions('-c:v libvpx')
      .outputOption('-c:v vp9')
      .size(`${quality}x?`)
      .aspect('16:9')
      .on('error', e => {
        rej(e);
      })
      .on('end', () => {
        res(1);
      })
      .saveToFile(outURI);
  });

  if (devMode) console.log(`Video with TID ${TID} cropped to ${quality} within ${(+new Date() - startTS) / 1000}s`);

  const item = new Storage({
    id: `${id}_q_${quality}`,
    dateAdded: +new Date(),
    URI: outURI
  });

  await item.save();

  await new Promise(res => {
    setTimeout(() => {
      res(1);
    }, 1000);
  });

  await store(`${id}_q_${quality}`);

  return outURI;
}

const previewsInFrame = 25; // TODO: (must be 25)
async function createPreview(id: string, TID: string, sourceURI: string): Promise<number> {
  const duration = await getVideoDurationInSeconds(sourceURI);
  const previews = Math.ceil(duration / 5);
  const frames = Math.ceil(previews / previewsInFrame);

  const tempFolder = `${path.resolve()}/tmp/processing/${TID}`;
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

  await cropPreviews(TID, sourceURI, previews, previewsFolder);
  await createFrames(id, previewsFolder, framesFolder);

  fs.rmSync(previewsFolder, { recursive: true });
  return frames;
}

async function cropPreviews(TID: string, sourceURI: string, previews: number, previewsFolder: string) {
  const tempDir = `${path.resolve()}/pw/${TID}`;
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  await new Promise(res => {
    ffmpeg(sourceURI)
      .screenshots({
        count: previews,
        size: '320x240',
        filename: '%s.webp',
        folder: `./pw/${TID}`
      })
      .on('end', () => {
        res(1);
      });
  });

  fs.readdirSync(tempDir).forEach(file => fs.copyFileSync(`${tempDir}/${file}`, `${previewsFolder}/${file}`));
  fs.rmSync(tempDir, { recursive: true });
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
    if (previewNow === previewsInFrame) { // TODO: test only (must be 25)
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

    await layer.toFile(outURI);
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
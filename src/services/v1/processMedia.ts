import { TUpload } from '../../core/IUpload';
import Storage from '../../Models/Storage';
import { ErrorConstructor, E400, writeErrorLog, E500 } from '../../handlers/v1/Errors';
import { writeToLog } from '../../handlers/v1/handlers';
import { IStorageItem } from '../../core/interfaces';
import fs from 'fs';
import path from 'path';
import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import ffmpeg from 'fluent-ffmpeg';
import { getVideoDurationInSeconds } from 'get-video-duration';
import { getFreeDiskURI, store } from './storage';
import sharp from 'sharp';
import { devMode, testMode } from '../../config';
import * as dto from '../../handlers/v1/dtos';
import uploadDB from '../../localDB/uploadDB.json' assert {type: 'json'};

export async function checkConditions(id: string) {
  const item = await Storage.findOne({ id });

  if (!item) {
    throw new E400('Item with provided id is not found in storage.');
  }

  // Check if disk have enought capacity
  await getFreeDiskURI(fs.statSync(item.URI).size * 3);
}

export interface IUploadQueue { id: string, type: TUpload, quality: TPVQuality[], URI: string, timestamp: number, relevant: boolean }

export class UploadQueue {
  private queue: IUploadQueue[];
  private isQueueFree = true;

  constructor(stopInitialRun?: boolean) {
    // @ts-ignore
    this.queue = (uploadDB.queue as IUploadQueue[]).sort((a, b) => a.timestamp - b.timestamp);
    // eslint-disable-next-line
    const th = this;

    (async function () {
      if (stopInitialRun) return;
      try {
        if (th.queue.length) {
          await new Promise(res => {
            th.queue.forEach(async (el, i) => {
              const item = await Storage.findOne({ id: el.id });

              if (!item) return;

              item.URI = el.URI;
              await item.save();

              if (i === th.queue.length - 1) {
                res(1);
              }
            });
          });

          th.run();
        }
      } catch (e) {
        // @ts-ignore
        writeErrorLog(`UploadQueue throw an error: ${e.message}`, 'services/v1/processMedida.ts/UploadQueue');
      }
    })();
  }

  add(id: string, URI: string, quality: TPVQuality[], type: TUpload, relevant: boolean) {
    this.queue.push({ id, URI, quality, type, timestamp: +new Date(), relevant });
    fs.writeFileSync(`${path.resolve()}/src/localDB/uploadDB.json`, JSON.stringify({ queue: this.queue }, null, 2));

    this.run();
  }

  remove(id: string) {
    this.queue = this.queue.filter(el => el.id !== id);
    fs.writeFileSync(`${path.resolve()}/src/localDB/uploadDB.json`, JSON.stringify({ queue: this.queue }, null, 2));
  }

  async run() {
    if (!this.queue.length) return devMode ? console.log('queue is empty') : null;
    if (!this.isQueueFree) return devMode ? console.log('queue is not free') : null;

    const { URI, id, quality, timestamp, type, relevant } = this.queue[0];

    this.isQueueFree = false;

    try {
      if (type.match(/^photo\//gi)) {
        await processPhoto(id, type);
      } else if (type.match(/^video\//gi)) {
        await processVideo(id, quality, relevant);
      }
    } catch (e) {
      // @ts-ignore
      writeErrorLog(`Queue errored: ${e.message}`, 'services/v1/processMedia/UploadQueue');
    }

    this.isQueueFree = true;
    this.remove(id);
    this.run();
  }
}



export async function processPhoto(id: string, type: TUpload) {
  const item = await Storage.findOne({ id });

  if (!item) {
    throw new E400('Item with provided id is not found in storage.');
  }

  writeToLog(`Started processing ${type} with id ${id}`);
  //! ConvertWebp func will remove file without updating it`s URI in storage. Untill URI will be replaced (cropAvatar/enchancePoster) current URI will be unaccesible. Use croppedURI instead 
  const croppedURI = await convertWebp(id, item);

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
  const croppedDest = `${path.resolve()}/tmp/processing/webp`;
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

export async function processVideo(id: string, quality: TPVQuality[], relevant: boolean) {
  const startedAt = +new Date();
  const item = await Storage.findOne({ id });
  const TID = testMode ? `testid-${(Math.random() + 1).toString(36).substring(8)}` : (Math.random() + 1).toString(36).substring(8);

  writeToLog(`Started processing video. ID: ${id}; TID: ${TID}, Q: ${quality}`);

  try {
    const uploadURI = item!.URI;
    const sourceURI = await convertWebm(id, TID, dto.storageItem(item!), relevant);

    await Promise.all([
      createPreview(id, TID, sourceURI),
      (quality.includes(720)) ? cropWebm(id, TID, sourceURI, 720, relevant) : null,
      (quality.includes(480)) ? cropWebm(id, TID, sourceURI, 480, relevant) : null,
      (quality.includes(240)) ? cropWebm(id, TID, sourceURI, 240, relevant) : null,
    ]);

    await store(id);

    fs.rmSync(`${path.resolve()}/tmp/processing/${TID}`, { recursive: true });
    console.log(`Video processing finished!\nID: ${id}\nWithin: ${(+new Date() - startedAt) / 1000}s`);
    writeToLog(`Video processing finished!\nID: ${id}\nWithin: ${(+new Date() - startedAt) / 1000}s`);
    fs.rmSync(uploadURI);
  } catch (e) {
    writeErrorLog(`Service throw an error: ${JSON.stringify(e)}. Reverting...`, 'services/v1/processMedia.ts/processVideo');

    if (!devMode) {
      return;
    }

    console.error(e);
  }
}

async function convertWebm(id: string, TID: string, item: IStorageItem, relevant: boolean): Promise<string> {
  const outFolder = `${path.resolve()}/tmp/processing/${TID}`;
  const outURI = `${outFolder}/${id}.webm`;
  const sourceURI = item.URI;
  const startTS = +new Date();

  if (!fs.existsSync(outFolder)) fs.mkdirSync(outFolder);
  console.log(`Start compressing video to webm with TID: ${TID}`);

  fs.writeFileSync(`${outFolder}/clearout-${startTS}`, ``);

  await new Promise((res, rej) => {
    ffmpeg(sourceURI)
      .videoCodec('libvpx')
      .audioCodec('libopus')
      .videoBitrate(relevant ? '2400k' : '1800k')
      .audioBitrate('128k')
      .outputOptions([
        '-minrate', relevant ? '1800k' : '1300k',
        '-maxrate', '2610k',
        '-crf', '32',
        '-threads', '0'
      ])
      .on('error', e => {
        rej(e);
      })
      .on('progress', progress => {
        if (devMode || testMode) console.log(`Ready: ${progress.percent}`);
      })
      .on('end', () => {
        res(1);
      })
      .saveToFile(outURI);
  });

  const db = await Storage.findOne({ id });
  db!.URI = outURI;

  await db!.save();

  if (devMode || testMode) console.log(`Compressing video with TID ${TID} ended within ${(+new Date() - startTS) / 1000}s`);

  return outURI;
}

export async function cropWebm(id: string, TID: string, sourceURI: string, quality: TPVQuality, relevant: boolean): Promise<string> {
  const outFolder = `${path.resolve()}/tmp/processing/${TID}`;
  const outURI = `${outFolder}/${id}_q_${quality}.webm`;
  const startTS = +new Date();

  if (!fs.existsSync(outFolder)) fs.mkdirSync(outFolder);
  if (devMode || testMode) console.log(`Start cropping video to ${quality} with TID: ${TID}`);

  fs.writeFileSync(outURI, '');

  await new Promise((res, rej) => {
    ffmpeg(sourceURI)
      .videoCodec('libvpx')
      .audioCodec('libopus')
      .videoBitrate(relevant ? '1300k' : '1100k')
      .audioBitrate('128k')
      .outputOptions([
        '-minrate', '900k',
        '-maxrate', relevant ? '1500k' : '1300k',
        '-crf', '31',
        '-threads', '0'
      ])
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

  if (devMode || testMode) console.log(`Video with TID ${TID} cropped to ${quality} within ${(+new Date() - startTS) / 1000}s`);

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

  writeToLog(`Started processing Frames for ID: ${id}; TID: ${TID}; F: ${frames}`);

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
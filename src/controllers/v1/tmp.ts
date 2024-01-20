import express from 'express';
import { ErrorConstructor } from '../../handlers/v1/Errors';
import { devMode } from '../../config';
import { ITitleEpisodeMeta } from '../../core/ITitle';
import puppeteer from 'puppeteer';
import path from 'path';
import * as uuid from 'uuid';
import fs from 'fs';
import { uploadFile } from '../../handlers/v1/handlers';
import ip from 'ip';
import Storage from '../../Models/Storage';

function parseCustomDateString(dateString: string): number {
  const months = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const dateParts = dateString.split(' ');

  const day = parseInt(dateParts[2]);
  const month = months[dateParts[1]];
  const year = parseInt(dateParts[3]);


  return +new Date(year, month, day);
}

export async function parseMetadata(req: express.Request, res: express.Response) {
  try {
    const { url } = req.body as { url: string };
    const results: ITitleEpisodeMeta[] = [];

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');

    // Navigate & wait for loading
    await page.goto(url);
    await page.waitForSelector('.ipc-page-section');

    // Parse
    const data = await page.$$eval('.ipc-page-section', el => {
      const cards = el[2].querySelectorAll('.sc-9115db22-1');
      let tmp: ITitleEpisodeMeta[] = [];

      cards.forEach((card, i) => {
        tmp.push({
          names: {
            eng: card.querySelector('.ipc-title__text').innerText.split('∙ ')[1],
            ukr: 'Тре змінити'
          },
          order: ++i,
          dateOut: card.querySelector('.sc-9115db22-10').innerText
        });
      });

      return tmp;
    });

    await browser.close();
    data.forEach(el => {
      results.push({
        names: el.names,
        order: el.order,
        // @ts-ignore
        dateOut: parseCustomDateString(el.dateOut)
      });
    });

    return res.status(200).json({ results });
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}

export async function createSnap(req: express.Request, res: express.Response) {
  try {
    const { url } = req.body as { url: string };

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    });

    // Navigate & wait for loading
    await page.goto(url);
    await page.waitForSelector('#content');

    // Take screenshot
    const snapURL = `${path.resolve()}/tmp/uploads/${uuid.v4()}.png`;
    await page.screenshot({ fullPage: true, path: snapURL });

    await browser.close();

    const snapID = await uploadFile(snapURL);
    fs.rmSync(snapURL);

    setTimeout(async () => {
      const item = await Storage.findOne({ id: snapID });

      fs.rmSync(item!.URI);
      await item!.deleteOne();
    }, 120000);

    return res.status(200).json({ url: `${devMode ? `http://${ip.address()}` : 'https://api.animee.club'}/v1/media/${snapID}` });
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}
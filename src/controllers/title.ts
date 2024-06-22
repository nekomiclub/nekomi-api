import express from 'express';
import axios, { AxiosError } from 'axios';
import { convert as urlSlugConvert } from 'url-slug';
import ip from 'ip';
import http from 'http';
import https from 'https';

import * as dto from '../handlers/dtos';

import { E400, E403, E404, E500, E501, E503, catchError, writeLog } from '../handlers/Errors';
import Title, { TitlePatcher, createTitle } from '../Models/Title';
import { AnimeAgeRates, AnimeGenres, AnimeSeasons, AnimeStatuses, ITitleEpisode, ITitleEpisodeMeta, TAnimeAgeRate, TAnimeGenre, TAnimeSeason, TAnimeStatus, TTitleCountry, TTitleType, TitleCountries, TitleTypes } from '../interfaces/Title';
import { config, devMode } from '../config';
import { decodeToken, singCSRFToken } from '../services/TokenService';
import User from '../Models/User';
import { getUTC, parseRoles } from '../handlers/handlers';
import { TRoleCapability } from '../interfaces/Roles';
import Dubbers from '../Models/Dubber';



export async function getTitleQuery(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const { query } = req.params as { query: string };

    const title = await Title.findOne({ $or: [{ id: query }, { code: query }] });

    if (!title) {
      throw new E404(`Title (${query}) is not found`);
    }

    return res.status(200).json({ msg: 'ok', title: dto.title(title.toObject()) });
  });
}

export async function getTotal(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const titles = await Title.find();

    return res.status(200).json({ msg: 'ok', total: titles.length, renewed: titles.filter(el => el.country !== 'Other').length });
  });
}

export async function postTitle(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const UserData = req.animee;
    const id = await createTitle(UserData.userID!, {});

    return res.status(201).json({ msg: 'Title created!', id });
  });
}

export interface IChangeEpMeta extends ITitleEpisodeMeta {
  action: 'edit' | 'delete'
}

interface IPatchTitleBody {
  changeNames?: {
    ukr?: string
    eng?: string
    alt?: string[]
  }

  setRating?: number
  setDescription?: string
  setStatus?: TAnimeStatus
  setEps?: number
  setGenres?: TAnimeGenre[]
  setAgeRate?: TAnimeAgeRate
  setSeason?: TAnimeSeason
  setType?: TTitleType
  setYear?: number
  setStudios?: string[]
  setCountry?: TTitleCountry
  setDetails?: string

  editEpMeta?: IChangeEpMeta

  deleteEpisode?: {
    episodeOrder?: string
    dubID?: string
  },
}

/** PATCH title form data type */
type TPatchTitleFormDataType = 'change_poster' | 'upload_episode'

export async function patchTitle(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const { id } = req.params as { id: string };
    const { userID, userCapabilities } = req.animee;
    const contentType = req.headers['content-type'] as 'multipart/form-data' | 'application/json';
    const { changeNames, deleteEpisode, editEpMeta, setAgeRate, setCountry, setDescription, setDetails, setEps, setGenres, setRating, setSeason, setStatus, setStudios, setType, setYear, } = req.body as IPatchTitleBody;

    const title = await Title.findOne({ id });
    const changes: string[] = [];

    if (!title) throw new E404(`Title ${id} is not found`);

    const Patcher = new TitlePatcher(title, {});
    title.updatedAt = getUTC().timestamp;

    // Upload poster / Episode
    if (contentType.match('multipart/form-data')) {
      const file = req.file;
      const { type, dubID, episodeOrder } = req.body as { type?: TPatchTitleFormDataType, episodeOrder?: string, dubID?: string };
      let { qualities } = req.body as { qualities?: string | number[] };

      if (!file) {
        throw new E400('File is not provided');
      }

      if (!type) {
        throw new E400('Type is not provided');
      }

      const { buffer, originalname, filename, mimetype } = file;
      const formData = new FormData();

      formData.append('file', new Blob([buffer], {
        type: mimetype
      }), originalname);
      formData.set('uploadedBy', userID);

      if (type === 'change_poster') {
        if (!userCapabilities!.includes('root') && !userCapabilities!.includes('titleEdit')) throw new E403('You do not have access to change poster');

        formData.set('type', 'photo/title/poster');

        try {
          if (title.poster.match('animee.club') || title.poster.match(ip.address())) {
            await axios.delete(`${config.URL.uploads}/upload/${title.poster.split('/')[title.poster.split('/').length - 1]}?by=${id}`, {
              validateStatus: (s) => s < 500,
              headers: {
                'X-CSRF-Token': singCSRFToken()
              }
            });
          }


          const { data: postData } = await axios.post<{ id: string }>(`${config.URL.uploads}/upload`, formData, {
            validateStatus: (s) => s < 500,
            headers: {
              'X-CSRF-Token': singCSRFToken()
            }
          });

          writeLog('info', `New poster for title ${title.id} uploaded by ${userID}`, 'patchTitle/changePoster');

          title.poster = `${config.URL.media}/${postData.id}`;
          title.markModified('poster');

          try {
            await title.save();
          } catch (e) {
            // ignore
          }

          return res.status(200).json({ msg: 'Poster uploaded', id: postData.id });
        } catch (e) {
          if (e instanceof AxiosError) {
            if (e.code === 'ECONNREFUSED') {
              throw new E503('Animee-uploads is not available. Try in a few minutes');
            }

            throw e;
          } else {
            throw e;
          }
        }
      } else if (type === 'upload_episode') {
        if (!userCapabilities!.includes('root') && !userCapabilities!.includes('seriesAdd')) throw new E403('You do not have access to uploading episodes');

        if (!dubID || !episodeOrder || !qualities) throw new E400('DubID, episode order and qualities are not required');

        try {
          qualities = JSON.parse(qualities as string) as number[];
        } catch (e) {
          throw new E400(`An error occured while parsing qualities field - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`);
        }

        const dubber = await Dubbers.findOne({ id: dubID });

        // Reject if dub is not found
        if (!dubber) throw new E404(`Dub ${dubID} is not found`);

        // Reject if episode is NaN
        if (isNaN(+episodeOrder)) throw new E400('Episode can not be NaN');
        const order = +episodeOrder;

        // Reject if episode exist
        if (title.episodes.some(el => el.dubberID === dubber.id && el.order === order)) {
          throw new E400(`Episode ${order} in ${dubber.id} already exist`);
        }

        const ep: ITitleEpisode = {
          dubberID: dubber.id,
          order,
          frames: [],
          qualities: {
            q1080: '',
            q240: null,
            q480: null,
            q4k: null,
            q720: null,
          }
        };

        // Upload episode
        formData.set('type', 'video/title/episode');
        formData.set('qualities', JSON.stringify(qualities));

        try {
          // Upload
          const { data } = await axios.post<{ id: string, frames: number }>(`${config.URL.uploads}/upload`, formData, {
            httpAgent: new http.Agent({ keepAlive: true }),
            httpsAgent: new https.Agent({ keepAlive: true }),
            timeout: 600000,
            headers: {
              'X-CSRF-Token': singCSRFToken()
            }
          });

          writeLog('info', `New episide (${ep.dubberID}/${ep.order}) for title ${title.id} uploaded by ${userID}`, 'patchTitle/uploadEpisode');

          const id = data.id;
          const frames = data.frames;

          // Set sources
          ep.qualities.q4k = qualities!.includes(2160) ? `${config.URL.media}/${id}_q_2160` : null;
          ep.qualities.q1080 = `${config.URL.media}/${id}`;
          ep.qualities.q720 = qualities!.includes(720) ? `${config.URL.media}/${id}_q_720` : null;
          ep.qualities.q480 = qualities!.includes(480) ? `${config.URL.media}/${id}_q_480` : null;
          ep.qualities.q240 = qualities!.includes(240) ? `${config.URL.media}/${id}_q_240` : null;

          // Set frames URLs
          let i = 0;

          while (i < frames) {
            ep.frames.push(`${config.URL.media}/${id}_f_${i}`);
            i++;
          }

          title.episodes.push(ep);

          // Sort episodes in order
          title.episodes.sort((a, b) => a.order - b.order);
          title.markModified('episodes');

          try {
            await title.save();
          } catch (e) {
            // ignore
          }

          return res.status(201).json({ msg: `Episode ${order} in ${dubber.name} created with ${frames} frames!` });
        } catch (e) {
          if (e instanceof AxiosError) {
            if (e.code === 'ECONNREFUSED') {
              throw new E503('Animee-uploads is not available. Try in a few minutes');
            }

            throw e;
          } else {
            throw e;
          }
        }
      }
      return;
    }


    // titleEdit - Tests are not required
    if (setDescription !== undefined) await execWithCap('titleEdit', () => Patcher.changeDescription(setDescription));
    if (setDetails !== undefined) await execWithCap('titleEdit', () => Patcher.changeDetails(setDetails));
    if (setAgeRate !== undefined) await execWithCap('titleEdit', () => Patcher.changeAgeRate(setAgeRate));
    if (setCountry !== undefined) await execWithCap('titleEdit', () => Patcher.changeCountry(setCountry));
    if (setGenres !== undefined) await execWithCap('titleEdit', () => Patcher.changeGenres(setGenres));
    if (setSeason !== undefined) await execWithCap('titleEdit', () => Patcher.changeSeason(setSeason));
    if (setStatus !== undefined) await execWithCap('titleEdit', () => Patcher.changeStatus(setStatus));
    if (setType !== undefined) await execWithCap('titleEdit', () => Patcher.changeType(setType));

    // titleEdit - Tests required
    if (setYear !== undefined) await execWithCap('titleEdit', changeYearHandler);
    if (changeNames !== undefined) await execWithCap('titleEdit', changeNamesHandler);
    if (setRating !== undefined) await execWithCap('titleEdit', changeRatingHandler);
    if (setStudios !== undefined) await execWithCap('titleEdit', changeStudiosHandler);
    if (setEps !== undefined) await execWithCap('titleEdit', changeEpisodesCountHandler);

    // titleEditEpsMeta - Test required
    if (editEpMeta !== undefined) await execWithCap('titleEditEpsMeta', changeEpisodeMeta);

    // seriesDelete - Test required
    if (deleteEpisode !== undefined) await execWithCap('seriesDelete', deleteEpisodeHandler);

    try {
      await Patcher.save();
    } catch (e) {
      // ignore
    }

    Patcher.getLog().forEach(el => changes.push(el));
    writeLog('info', `Title ${title.id} patched by ${userID}. Changed - ${changes.join(', ')}`, 'patchTitle');

    return res.status(200).json({ msg: 'ok', changes: changes.length ? changes : `Nothing changed` });



    async function execWithCap(capability: TRoleCapability, cb: () => any | Promise<any>) {
      if (!userCapabilities?.includes(capability) && !userCapabilities!.includes('root')) throw new E403('Patching not allowed');

      return await cb();
    }

    function changeNamesHandler() {
      if (!Array.isArray(changeNames?.alt)) throw new E400('Alt names must be an array');

      Patcher.changeNames({
        alt: changeNames?.alt,
        eng: changeNames?.eng,
        ukr: changeNames?.ukr,
      });
    }

    function changeRatingHandler() {
      if (isNaN(+setRating!)) throw new E400('Rating can not be NaN');

      Patcher.changeRating(+setRating!, 'IMDB');
    }

    function changeStudiosHandler() {
      if (!Array.isArray(setStudios)) throw new E400('Studios must be an array');

      Patcher.changeStudios(setStudios);
    }

    function changeEpisodesCountHandler() {
      if (isNaN(+setEps!)) throw new E400('Episodes count (setEps) can not be NaN');

      Patcher.changeEpisodesCount(+setEps!);
    }

    function changeYearHandler() {
      if (isNaN(+setYear!)) throw new E400('EYear can not be NaN');

      Patcher.changeYear(+setYear!);
    }

    function changeEpisodeMeta() {
      if (isNaN(+editEpMeta!.dateOut!)) throw new E400('DateOut in episode meta can not be NaN');
      if (isNaN(+editEpMeta!.order!)) throw new E400('Order in episode meta can not be NaN');

      Patcher.changeEpisodeMeta({
        action: editEpMeta!.action!,
        dateOut: +editEpMeta!.dateOut!,
        order: +editEpMeta!.order!,
        names: editEpMeta!.names!,
      });
    }

    function deleteEpisodeHandler() {
      if (isNaN(+deleteEpisode!.episodeOrder!)) throw new E400('Order in episode meta can not be NaN');

      Patcher.deleteEpisode(userID!, {
        dubID: deleteEpisode!.dubID!,
        order: +deleteEpisode!.episodeOrder!
      });
    }
  });
}

export async function deleteTitle(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const { id } = req.params as { id: string };
    const UserData = req.animee;

    const title = await Title.findOne({ id });

    if (!title) throw new E404(`Title ${id} is not found`);

    writeLog('warn', `Title ${id} deleted by ${UserData.userID}`, 'deleteTitle');

    await title.deleteOne();
  });
}
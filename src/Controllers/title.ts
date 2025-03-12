import express from 'express';

import DubberModel from '~/core/models/DubberModel';
import User from '~/models/User';
import { AnimeEpisodeMeta, TAnimeAgeRate, TAnimeGenre, TAnimeSeason, TAnimeStatus, TTitleCountry, TTitleType } from '~/core/interfaces/AnimeIntf';
import { E404, ERR_ACCESS_REJECTED, ERR_INVALID_PAYLOAD, ERR_MIDDLEWARE_REQUIRED, ERR_TYPE_INVALID, HandleRequest } from '~/services/ErrorService';
import { EpisodeQualities, TEpisodeQuality } from '~/core/interfaces/API/NekomiUploadsAPI';
import { TRoleCapability } from '~/core/interfaces/RoleIntf';

import TitleModel from '~/core/models/TitleModel';
import { TitleService } from '~/models/Title';




interface IPatchTitleBody {
  names?: {
    eng?: string
    ukr?: string
    alt?: string[]
  }
  ageRate?: TAnimeAgeRate
  country?: TTitleCountry
  description?: string
  details?: string
  genres?: TAnimeGenre[]
  season?: TAnimeSeason
  status?: TAnimeStatus
  studios?: string[]
  type?: TTitleType
  year?: number
  episodesCount?: number
  IMDBRating?: number
  AnimeeRating?: number
  malRating?: number
  malPoll?: number
  mal_id?: string

  editEpMeta?: IChangeEpMeta
  parseIMDBEpisodesMeta?: string

  deleteEpisode?: IDeleteEpisode

  // Form Data
  uploadEpisode?: IUploadEpisode

  uploadPoster?: IUploadPoster
}

interface IDeleteEpisode {
  order: number
  dubberID: string
}

interface IUploadEpisode {
  /** req.file */
  file?: Express.Multer.File
  type: TPatchTitleFormDataType
  order: number,
  dubberID: string
  qualities: TEpisodeQuality[]
}

interface IUploadPoster {
  /** req.file */
  file?: Express.Multer.File
  type: TPatchTitleFormDataType
}

export interface IChangeEpMeta extends AnimeEpisodeMeta {
  action: 'edit' | 'delete'
}

type TPatchTitleFormDataType = 'change_poster' | 'upload_episode';




export async function patchTitle(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const { id } = req.params as { id: string };
    const { capabilities, id: userID, username } = req.nekomi.user!;
    const contentType = req.headers['content-type'] as 'multipart/form-data' | 'application/json';

    const title = await TitleModel.findOne({ id });
    if (!title) throw new E404(`Title ${id} is not found`);

    const user = (await User.findOne({ id: userID }))!;
    const Patcher = new TitleService({ title });

    //* Handle Form Data
    if (contentType.includes('multipart/form-data')) {
      const file = req.file;
      const { type } = req.body as { type: TPatchTitleFormDataType };

      if (!file) throw new ERR_INVALID_PAYLOAD(`File is not provided`);

      if (type === 'change_poster') {
        const { id, posterURL } = await Patcher.uploadPoster({ file, user });

        return res.status(200).json({ message: 'Poster uploaded', id, posterURL });
      } else if (type === 'upload_episode') {
        const { dubberID } = req.body as IUploadEpisode;
        let qualities = JSON.parse(req.body.qualities) as TEpisodeQuality[];
        let { order } = req.body as IUploadEpisode;

        const dubber = await DubberModel.findOne({ id: dubberID });
        if (!dubber) throw new E404(`Dubber ${dubberID} is not found`);

        order = +order;
        if (isNaN(order)) throw new ERR_TYPE_INVALID(`Order can not be NaN`);

        if (!Array.isArray(qualities)) throw new ERR_TYPE_INVALID(`Qualities are not an array`);

        qualities.forEach(el => {
          if (isNaN(+el)) throw new ERR_TYPE_INVALID(`Quality ${el} is not a number`);
        });

        let tmpQualities: TEpisodeQuality[] = [];

        qualities.forEach(quality => {
          if (EpisodeQualities.includes(quality)) tmpQualities.push(quality);
        });

        qualities = tmpQualities;

        const ep = await Patcher.uploadEpisode({
          file,
          user,
          dubber,
          episodeOrder: order,
          qualities
        });

        return res.status(201).json({ message: 'New episode uploaded', episode: ep });
      } else throw new ERR_INVALID_PAYLOAD(`FormData type ${type} is invalid`);
    }



    const { ageRate, country, deleteEpisode, description, details, editEpMeta, episodesCount, genres, names, parseIMDBEpisodesMeta, season, status, studios, type, year, AnimeeRating, IMDBRating, malPoll, malRating, mal_id } = req.body as IPatchTitleBody;

    // titleEdit - Simple type
    if (description !== undefined) await execWithCap('titleEdit', async () => await Patcher.patchDescription(description));
    if (details !== undefined) await execWithCap('titleEdit', async () => await Patcher.patchDetails(details));
    if (ageRate !== undefined) await execWithCap('titleEdit', async () => await Patcher.patchAgeRate(ageRate));
    if (country !== undefined) await execWithCap('titleEdit', async () => await Patcher.patchCountry(country));
    if (genres !== undefined) await execWithCap('titleEdit', async () => await Patcher.patchGenres(genres));
    if (season !== undefined) await execWithCap('titleEdit', async () => await Patcher.patchSeason(season));
    if (status !== undefined) await execWithCap('titleEdit', async () => await Patcher.patchStatus(status));
    if (type !== undefined) await execWithCap('titleEdit', async () => await Patcher.patchType(type));
    if (names !== undefined) await execWithCap('titleEdit', async () => Patcher.patchNames(names));
    if (mal_id !== undefined) await execWithCap('titleEdit', async () => Patcher.patchMalID({ mal_id }));

    // titleEdit - Not NaN
    if (episodesCount !== undefined) await execWithCap('titleEdit', async () => await Patcher.patchEpisodesCount(parseNaN('Episodes count', episodesCount)));
    if (AnimeeRating !== undefined) await execWithCap('titleEdit', async () => await Patcher.patchRating(parseNaN('IMDB Rating', AnimeeRating), 'Animee'));
    if (IMDBRating !== undefined) await execWithCap('titleEdit', async () => await Patcher.patchRating(parseNaN('IMDB Rating', IMDBRating), 'IMDB'));
    if (year !== undefined) await execWithCap('titleEdit', async () => await Patcher.patchYear(parseNaN('Year', year)));

    // titleEdit - Is array
    if (studios !== undefined) await execWithCap('titleEdit', async () => await Patcher.patchStudios(parseArray('Studios', studios, 'string')));

    // titleEditEpsMeta
    if (parseIMDBEpisodesMeta !== undefined) await execWithCap('titleEditEpsMeta', async () => Patcher.parseIMDBEpisodesMeta(parseIMDBEpisodesMeta));
    if (editEpMeta !== undefined) await execWithCap('titleEditEpsMeta', parseEditEpMeta);

    // seriesDelete
    if (deleteEpisode !== undefined) await execWithCap('seriesDelete', parseDeleteEpisode);



    await Patcher.save();

    return res.status(200).json({ message: 'Title patched', stack: Patcher.stack });



    async function execWithCap(capability: TRoleCapability, cb: () => any | Promise<any>) {
      if (!capabilities.includes('root') && !capabilities.includes(capability)) throw new ERR_ACCESS_REJECTED();

      return await cb();
    }

    function parseNaN(label: string, val: string | number): number {
      if (isNaN(+val)) throw new ERR_TYPE_INVALID(`${label} can not be NaN`);
      return +val;
    }

    function parseArray(label: string, array: any[], type?: 'string' | 'number'): any[] {
      if (!Array.isArray(array)) throw new ERR_TYPE_INVALID(`${label} is not an array`);

      if (type) {
        array.forEach(el => {
          if (typeof el !== type) throw new ERR_TYPE_INVALID(`${label} array element ${el} is not required type (${typeof el} != ${type})`);
        });
      }

      return array;
    }



    async function parseEditEpMeta() {
      const { action, names } = editEpMeta!;
      let { dateOut, order } = editEpMeta!;

      if (action === undefined || dateOut === undefined || names === undefined || order === undefined) throw new ERR_TYPE_INVALID(`Some field in editEpMeta are missing at editEpMeta`);

      dateOut = parseNaN('DateOUT', dateOut);
      order = parseNaN('Order', order);

      if (names.eng === undefined || names.ukr === undefined) throw new ERR_TYPE_INVALID(`Some field in editEpMeta are missing at editEpMeta`);

      await Patcher.patchEpisodeMeta({
        action,
        dateOut,
        names,
        order
      });
    }

    async function parseDeleteEpisode() {
      const { dubberID } = deleteEpisode!;
      let { order } = deleteEpisode!;

      if (dubberID === undefined || order === undefined) throw new ERR_TYPE_INVALID(`Some fields are missing at deleteEpisode`);

      const dubber = await DubberModel.findOne({ id: dubberID });
      if (!dubber) throw new E404(`Dubber ${dubberID} is not found`);

      order = parseNaN('Order', order);

      await Patcher.deleteEpisode({
        dubber,
        order,
        user
      });
    }
  });
}
import express from 'express';

import * as dto from '../handlers/dtos';

import Title, { TitleService } from '../Models/Title';
import { ITitle, ITitleEpisode, ITitleEpisodeMeta, TAnimeAgeRate, TAnimeGenre, TAnimeSeason, TAnimeStatus, TTitleCountry, TTitleType, TitleCountries, TitleTypes } from '../interfaces/Title';
import { config, devMode, prodMode, testMode } from '../config';
import { singCSRFToken } from '../services/TokenService';
import User from '../Models/User';
import { TRoleCapability } from '../interfaces/Roles';
import Dubber from '../Models/Dubber';
import { updateSearch } from './root';
import { $http } from '../handlers/http';
import { FK_AUTHORITY_ROUTES, FK_USAPI_ROUTES, IFK_AuthorityVerify, IFK_UsapiAuthRefresh } from '../interfaces/FullkekwResponses';
import { IDubber } from '../interfaces/Dubber';
import { E403, E404, E418, E503, ERR_ACCESS_REJECTED, ERR_ALREADY_EXIST, ERR_INVALID_PAYLOAD, ERR_MISSING_AUTHORIZATION, ERR_NOT_READY, ERR_TYPE_INVALID, HandleRequest, HTTPErrorConstructor } from '../services/ErrorService';
import { Logger } from '../services/LoggerService';
import { getMockData } from '../handlers/mocks';
import { IM_CSRFCheck } from '../interfaces/Mocks';
import { EpisodeQualities, TEpisodeQuality } from '../interfaces/Services';
import Cache from '../services/CacheService';
import { IUserWatchProgress } from '../interfaces/User';




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

export interface IChangeEpMeta extends ITitleEpisodeMeta {
  action: 'edit' | 'delete'
}

type TPatchTitleFormDataType = 'change_poster' | 'upload_episode';




export async function getTitleQuery(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const CSRFToken = req.header(config.vars.csrfHeader);

    const { query } = req.params as { query: string };
    const { detailed, parseDubbers } = req.query as { detailed?: string, parseDubbers?: boolean };

    const title = await Title.findOne({ $or: [{ id: query }, { code: query }] });
    if (!title) throw new E404(`Title ${query} is not found`);

    let parsedDubbers: IDubber[] | undefined = undefined;
    let privateMode = true;

    // Check if client can get detailed data
    if (detailed !== undefined && CSRFToken !== undefined) {
      const DATA: IFK_AuthorityVerify = {
        msg: '',
        origin: '',
        verified: false
      };

      if (!testMode) {
        const { data } = await $http.post<IFK_AuthorityVerify>(FK_AUTHORITY_ROUTES.verify, {
          token: CSRFToken
        });

        DATA.origin = data.origin;
        DATA.verified = data.verified;
      } else {
        const { data } = getMockData<IM_CSRFCheck>(req, 'CSRFCheck');

        DATA.origin = data.origin;
        DATA.verified = data.verified;
      }

      if (DATA.verified && DATA.origin === 'animee.club') {
        privateMode = !DATA.verified;
      } else {
        throw new ERR_ACCESS_REJECTED(`Can not get detailed title information due to token error`);
      }
    }

    if (parseDubbers !== undefined && !privateMode) {
      const dubberIDs: string[] = [];

      title.episodes.forEach(el => !dubberIDs.includes(el.dubberID) ? dubberIDs.push(el.dubberID) : null);

      parsedDubbers = (await Dubber.find({ id: { $in: dubberIDs } })).map(dubber => dto.dubber(dubber.toObject(), privateMode));
    }

    return res.status(200).json({ message: privateMode ? 'Title returned in private mode' : 'Title returned in detailed mode', title: dto.title(title.toObject(), privateMode), parsedDubbers });
  });
}

export async function getTotal(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const titles = await Title.find();

    const total = titles.length;
    const renewed = titles.filter(el => el.country !== 'Other').length;

    return res.status(200).json({ message: 'ok', total, renewed });
  });
}

export async function postTitle(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const title = await TitleService.create({});

    updateSearch('title');

    return res.status(201).json({ message: 'New title created', id: title.id, title: dto.title(title.toObject()) });
  });
}

export async function patchTitle(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const { id } = req.params as { id: string };
    const { capabilities, id: userID, username } = req.animee.user!;
    const contentType = req.headers['content-type'] as 'multipart/form-data' | 'application/json';

    const title = await Title.findOne({ id });
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
        const { dubberID, type } = req.body as IUploadEpisode;
        let { order, qualities } = req.body as IUploadEpisode;

        const dubber = await Dubber.findOne({ id: dubberID });
        if (!dubber) throw new E404(`Dubber ${dubberID} is not found`);

        order = +order;
        if (isNaN(order)) throw new ERR_TYPE_INVALID(`Order can not be NaN`);

        if (!Array.isArray(qualities)) throw new ERR_TYPE_INVALID(`Qualities is not an array`);

        qualities.forEach(el => {
          if (isNaN(+el)) throw new ERR_TYPE_INVALID(`Quality ${el} is not a number`);
        });

        qualities = qualities.map(el => EpisodeQualities.includes(Number(el) as TEpisodeQuality) ? Number(el) as TEpisodeQuality : undefined).filter(el => el !== undefined);

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



    const { ageRate, country, deleteEpisode, description, details, editEpMeta, episodesCount, genres, names, parseIMDBEpisodesMeta, season, status, studios, type, year, AnimeeRating, IMDBRating } = req.body as IPatchTitleBody;



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

      const dubber = await Dubber.findOne({ id: dubberID });
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

export async function deleteTitle(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const { id } = req.params as { id: string };
    const { key } = req.query as { key?: string };
    const { id: userID, username } = req.animee.user!;

    if (!key) {
      console.log(`-------- DELETE TITLE KEY ISSUED --------\nIssuer: ${userID}/${username}\nKey: ${singCSRFToken()}\n----------------`);
      Logger.info(`[TitleController]: Title ${id} delete request by ${userID}/${username} detected. Delete token issued in server console`);

      throw new ERR_MISSING_AUTHORIZATION();
    }

    const title = await Title.findOne({ id });
    if (!title) throw new E404(`Title ${id} is not found`);

    const CSRF_DATA: IM_CSRFCheck = {
      origin: '',
      verified: false
    };

    if (!testMode) {
      const { data } = await $http.post<IFK_AuthorityVerify>(`${config.URL.fullkekw_authority}/verify`, {
        token: key
      });

      CSRF_DATA.verified = data.verified;
      CSRF_DATA.origin = data.origin;
    } else {
      const { data } = getMockData<IM_CSRFCheck>(req, 'CSRFCheck');

      CSRF_DATA.verified = data.verified;
      CSRF_DATA.origin = data.origin;
    }

    const { origin, verified } = CSRF_DATA;

    if (!verified || origin !== 'api.animee.club') throw new ERR_ACCESS_REJECTED();

    await TitleService.delete(id, `Title deleted by ${userID}/${username}`, 'one');

    updateSearch('title');
  });
}

export async function getHomeWrapped(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!Cache.HomeWrapped.featured.length) throw new ERR_NOT_READY();

    const sessionToken = req.cookies[config.vars.sessionCookie];
    const session: IFK_UsapiAuthRefresh = {
      id: '',
      avatar: '',
      msg: '',
      username: ''
    };

    let watchProgress: IUserWatchProgress[] | undefined = undefined;

    // Parse user
    if (sessionToken) {
      try {
        const { data: sessionData } = await $http.get<IFK_UsapiAuthRefresh>(FK_USAPI_ROUTES.refresh, {
          headers: {
            Cookie: `session=${sessionToken}`
          }
        });

        session.id = sessionData.id;
      } catch (e) {
        // Ignore
      }
    }

    // Get user if session valid
    if (session.id) {
      const user = await User.findOne({ id: session.id });
      if (!user) return;

      watchProgress = [];

      Cache.HomeWrapped.featured.forEach(el => {
        const wp = user.watchProgress.find(wp => wp.titleID === el.id);

        if (wp) watchProgress!.push(wp);
      });
    }

    return res.status(200).json({ message: 'OK', ...Cache.HomeWrapped, watchProgress });
  });
}
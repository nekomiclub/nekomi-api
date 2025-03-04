import express from 'express';

import CacheService from '~/services/CacheService';
import DubberModel from '~/core/models/DubberModel';
import FullkekwAuthorityAPI from '~/core/services/API/FullkekwAuthorityApi';
import Title, { TitleModel, TitleService } from '~/models/Title';
import User from '~/models/User';
import { Anime, AnimeEpisodeMeta, TAnimeAgeRate, TAnimeGenre, TAnimeSeason, TAnimeStatus, TTitleCountry, TTitleType } from '~/interfaces/Anime.intf';
import { E404, ERR_ACCESS_REJECTED, ERR_INVALID_PAYLOAD, ERR_MIDDLEWARE_REQUIRED, ERR_MISSING_AUTHORIZATION, ERR_TYPE_INVALID, HandleRequest } from '~/services/ErrorService';
import { EpisodeQualities, TEpisodeQuality } from '~/core/interfaces/API/NekomiUploadsAPI';
import { FullkekwAuthorityAPI_TokenVerify } from '~/core/interfaces/API/FullkekwAuthorityAPI.intf';
import { FullkekwUserAPI_TokenData } from '~/core/interfaces/API/FullkekwUserAPI.intf';
import { IDubber } from '~/core/interfaces/Dubber.intf';
import { IM_FkAuthorityVerify } from '~/interfaces/types';
import { IUserWatchProgress } from '~/interfaces/User.intf';
import { Logger } from '~/services/LoggerService';
import { MiddlewareService } from '~/services/MiddlewareService';
import { MongoDocumentDTO } from '~/core/services/DTO';
import { TRoleCapability } from '~/interfaces/Role.intf';
import { TestMode, config } from '~/config';
import { getMockData } from '~/handlers/mocks';
import { getUTC } from '~/handlers/handler';
import { signCSRFToken } from '~/services/TokenService';
import { updateSearch } from './root';




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

interface ITitleWithMeta extends Anime {
  videoURL: string
  backgroundURL: string
}

interface IHomeWrapped {
  featured: ITitleWithMeta[]
  hightRated: Anime[]
  popular: Anime[]
  updatedRecently: Anime[]
}

export interface IChangeEpMeta extends AnimeEpisodeMeta {
  action: 'edit' | 'delete'
}

type TPatchTitleFormDataType = 'change_poster' | 'upload_episode';



export const AnimeHomeWrappedCache = new CacheService<IHomeWrapped>('AnimeHomeWrappedCache');



export async function getTitleQuery(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const CSRFToken = req.header(config.vars.csrfHeader);

    const { query } = req.params as { query: string };
    const { detailed, parseDubbers } = req.query as { detailed?: string, parseDubbers?: boolean };

    const title = await Title.findOne({ $or: [{ id: query }, { code: query }, { mal_id: query }] });
    if (!title) throw new E404(`Title ${query} is not found`);

    let parsedDubbers: IDubber[] | undefined = undefined;
    let privateMode = true;

    // Check if client can get detailed data
    if (detailed !== undefined && CSRFToken !== undefined) {
      const DATA: FullkekwAuthorityAPI_TokenVerify = {
        origin: '',
        verified: false
      };

      if (!TestMode) {
        const data = await FullkekwAuthorityAPI.verifyToken({ token: CSRFToken });

        DATA.origin = data.origin;
        DATA.verified = data.verified;
      } else {
        const { data } = getMockData<IM_FkAuthorityVerify>(req, 'FkAuthorityVerify');

        DATA.origin = data.origin;
        DATA.verified = data.verified;
      }

      if (DATA.verified && DATA.origin === config.DOMAIN.nekomi) {
        privateMode = !DATA.verified;
      } else {
        throw new ERR_ACCESS_REJECTED(`Can not get detailed title information due to token error`);
      }
    }

    if (parseDubbers !== undefined && !privateMode) {
      const dubberIDs: string[] = [];

      title.episodes.forEach(el => !dubberIDs.includes(el.dubberID) ? dubberIDs.push(el.dubberID) : null);

      parsedDubbers = (await DubberModel.find({ id: { $in: dubberIDs } })).map(dubber => new MongoDocumentDTO().dubber({ document: dubber, details: !privateMode }));
    }

    // TODO add sync with hikka.io
    // // Sync with hikka.io if mal id is present
    // if (title.mal_id && (
    //   // Title is ongoing and must be synced every 3 days
    //   (title.status === 'ongoing' && title.hikkaSyncedAt + (60000 * 24 * 3) < getUTC().timestamp) ||
    //   // Title is not ongoing and must be synced every 21 days
    //   (title.status !== 'ongoing' && title.hikkaSyncedAt + (60000 * 24 * 21) < getUTC().timestamp)
    // )) {
    //   //* Get slug
    //   // https://api.hikka.io/integrations/mal/anime/{mal_id} 

    //   //* Get full anime data
    //   // https://api.hikka.io/anime/{slug}



    //   Logger.info(`Title ${title.id} synced with hikka.io`);
    // }

    return res.status(200).json({ message: privateMode ? 'Title returned in private mode' : 'Title returned in detailed mode', title: new MongoDocumentDTO().anime({ document: title, details: !privateMode }), parsedDubbers });
  });
}

export async function getTotal(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const titles = await Title.find();

    const total = titles.length;
    const renewed = titles.filter(el => el.country !== 'Other').length;

    return res.status(200).json({ message: 'OK', total, renewed });
  });
}

export async function postTitle(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const title = await TitleService.create({});

    updateSearch('title');

    return res.status(201).json({ message: 'New title created', id: title.id, title: new MongoDocumentDTO().anime({ document: title }) });
  });
}

export async function patchTitle(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const { id } = req.params as { id: string };
    const { capabilities, id: userID, username } = req.nekomi.user!;
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

export async function deleteTitle(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const { id } = req.params as { id: string };
    const { key } = req.query as { key?: string };
    const { id: userID, username } = req.nekomi.user!;

    if (!key) {
      console.log(`-------- DELETE TITLE KEY ISSUED --------\nIssuer: ${userID}/${username}\nKey: ${signCSRFToken()}\n----------------`);
      Logger.info(`[TitleController]: Title ${id} delete request by ${userID}/${username} detected. Delete token issued in server console`);

      throw new ERR_MISSING_AUTHORIZATION();
    }

    const title = await Title.findOne({ id });
    if (!title) throw new E404(`Title ${id} is not found`);

    const CSRF_DATA: IM_FkAuthorityVerify = {
      origin: '',
      verified: false
    };

    if (!TestMode) {
      const data = await FullkekwAuthorityAPI.verifyToken({ token: key });

      CSRF_DATA.verified = data.verified;
      CSRF_DATA.origin = data.origin;
    } else {
      const { data } = getMockData<IM_FkAuthorityVerify>(req, 'FkAuthorityVerify');

      CSRF_DATA.verified = data.verified;
      CSRF_DATA.origin = data.origin;
    }

    const { origin, verified } = CSRF_DATA;

    if (!verified || origin !== config.DOMAIN.nekomi_core) throw new ERR_ACCESS_REJECTED();

    await TitleService.delete(id, `Title deleted by ${userID}/${username}`, 'one');

    updateSearch('title');

    return res.status(200).json({ message: 'Title deleted' });
  });
}

export async function getHomeWrapped(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    let HomeWrapped: IHomeWrapped = {
      featured: [],
      hightRated: [],
      popular: [],
      updatedRecently: []
    };

    const cache = AnimeHomeWrappedCache.get({ id: 'HomeWrapped' });

    if (cache) {
      HomeWrapped = cache;
    } else {
      const titles = await TitleModel.find();

      // Parse featured
      for (const key in config.STATIC.HomeWrapped.featured) {
        const { backgroundURL, id, videoURL } = config.STATIC.HomeWrapped.featured[key];

        const title = await TitleModel.findOne({ id: id });
        if (!title) throw new E404(`Title ${id} is not found in featured data`);

        HomeWrapped.featured.push({
          ...new MongoDocumentDTO().anime({ document: title }),
          backgroundURL,
          videoURL
        });
      }

      // Parse popular
      HomeWrapped.popular = (await TitleModel.find({ id: { $in: config.STATIC.HomeWrapped.popular } })).map(el => new MongoDocumentDTO().anime({ document: el }));

      // Fetch recently updated
      HomeWrapped.updatedRecently = titles.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20).map(el => new MongoDocumentDTO().anime({ document: el }));

      // Fetch hight rated
      HomeWrapped.hightRated = titles.filter(el => el.rating.IMDB !== null).sort((a, b) => b.rating!.IMDB! - a.rating!.IMDB!).slice(0, 20).map(el => new MongoDocumentDTO().anime({ document: el }));

      AnimeHomeWrappedCache.push({
        id: 'HomeWrapped',
        createdAt: getUTC().timestamp,
        data: HomeWrapped
      });
    }

    const sessionToken = req.cookies[config.vars.sessionCookie];
    const session: FullkekwUserAPI_TokenData = {
      id: '',
      avatar: '',
      username: ''
    };

    let watchProgress: IUserWatchProgress[] | undefined = undefined;

    // Parse user
    if (sessionToken) {
      if (!TestMode) {
        const middleware = new MiddlewareService();

        try {
          const { user } = await middleware.checkAccess(sessionToken);

          session.id = user.id;
        } catch (e) {
          // Ignore
        }
      } else {
        const { data } = getMockData<FullkekwUserAPI_TokenData>(req, 'FkUsapiAuthRefresh');

        session.id = data.id;
      }
    }

    // Get user if session valid
    if (session.id) {
      const user = await User.findOne({ id: session.id });
      if (!user) return;

      watchProgress = [];

      HomeWrapped.featured.forEach(el => {
        const wp = user.watchProgress.find(wp => wp.titleID === el.id);

        if (wp) watchProgress!.push(wp);
      });
    }

    return res.status(200).json({ message: 'OK', ...HomeWrapped, watchProgress });
  });
}
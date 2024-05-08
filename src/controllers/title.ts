import express from 'express';
import axios, { AxiosError } from 'axios';
import { convert as urlSlugConvert } from 'url-slug';
import ip, { or } from 'ip';

import * as dto from '../handlers/dtos';

import { E400, E403, E404, E500, E501, E503, catchError } from '../handlers/v1/Errors';
import Title, { createTitle } from '../Models/Title';
import { AnimeAgeRates, AnimeGenres, AnimeSeasons, AnimeStatuses, ITitleEpisodeDubbed, ITitleEpisodeMeta, ITitleEpisodesDub, TAnimeAgeRate, TAnimeGenre, TAnimeSeason, TAnimeStatus, TTitleType, TitleTypes } from '../interfaces/Title';
import { config, devMode } from '../config';
import { decodeToken } from '../services/TokenService';
import User from '../Models/User';
import { getUTC, parseRoles } from '../handlers/v1/handlers';
import { TRoleCapability } from '../interfaces/Roles';
import Dubbers from '../Models/Dubber';



export async function getTitleQuery(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    const { query } = req.params as { query: string };

    const title = await Title.findOne({ $or: [{ id: query }, { code: query }] });

    if (!title) {
      throw new E404(`Title (${query}) is not found`);
    }

    return res.status(200).json({ msg: 'ok', title: dto.title(title.toObject()) });
  });
}



export async function getTotal(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    const titles = await Title.find();

    return res.status(200).json({ msg: 'ok', total: titles.length, renewed: titles.map(el => el.country !== 'null').length });
  });
}



export async function postTitle(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    const id = await createTitle();

    return res.status(201).json({ msg: 'Title created!', id });
  });
}



interface IChangeEpMeta extends ITitleEpisodeMeta {
  action: 'edit' | 'delete' | 'add'
}

interface IPatchTitleBody {
  changeNames?: {
    ukr?: string | null
    eng?: string | null
    alt?: string[] | null
  }

  setRating?: number
  setDescription?: string
  setStatus?: string
  setEps?: number
  setGenres?: string[]
  setAgeRate?: string
  setSeason?: string
  setType?: string
  setYear?: number
  setStudios?: string[]
  setCountry?: string
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
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    const { id } = req.params as { id: string };
    const contentType = req.headers['content-type'] as 'multipart/form-data' | 'application/json';
    const { changeNames, deleteEpisode, editEpMeta, setAgeRate, setCountry, setDescription, setDetails, setEps, setGenres, setRating, setSeason, setStatus, setStudios, setType, setYear, } = req.body as IPatchTitleBody;

    const title = await Title.findOne({ id });
    const changes: string[] = [];

    if (!title) throw new E404(`Title ${id} is not found`);

    const session = decodeToken<{ userId: string }>(req.cookies[config.vars.sessionCookieName] || req.headers['authorization']);
    const user = await User.findOne({ id: session.payload.userId });

    if (!user) {
      throw new E404('User with this session is not exist');
    }

    title.updatedAt = getUTC().timestamp;
    const caps = await parseRoles(user.roles);

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
      formData.set('createdBy', user.id);

      if (type === 'change_poster') {
        if (!caps.includes('root') && !caps.includes('titleEdit')) throw new E403('You do not have access to change poster');

        formData.set('type', 'photo/title/poster');

        try {
          if (title.poster.match('animee.club') || title.poster.match(ip.address())) {
            //* Update
            const id = title.poster.split('/')[title.poster.split('/').length - 1];

            const { data: putData } = await axios.put(`${config.microservices.uploadsURL}/v1/upload/${id}`, formData, { validateStatus: (s) => s < 500 });

            // If poster unavailable
            if (putData.code === 404) {
              const { data: postData } = await axios.post<{ id: string }>(`${config.microservices.uploadsURL}/v1/upload`, formData, { validateStatus: (s) => s < 500 });

              title.poster = `${config.URL.media}/${postData.id}`;
              title.markModified('poster');

              try {
                await title.save();
              } catch (e) {
                // ignore
              }

              return res.status(201).json({ msg: 'Poster is unavailable, creating new..', id });
            } else {
              return res.status(200).json({ msg: 'Poster changed', id });
            }
          } else {
            //* Upload new
            const { data: postData } = await axios.post<{ id: string }>(`${config.microservices.uploadsURL}/v1/upload`, formData, { validateStatus: (s) => s < 500 });

            title.poster = `${config.URL.media}/${postData.id}`;
            title.markModified('poster');

            try {
              await title.save();
            } catch (e) {
              // ignore
            }

            return res.status(200).json({ msg: 'Poster uploaded' });
          }
        } catch (e) {
          if (e instanceof AxiosError) {
            if (e.code === 'ECONNREFUSED') {
              throw new E503('Animee-uploads is not available. Try in a few minutes');
            }

            return res.status(e.response?.data.code || 500).json({ msg: e.response?.data.msg || `An error occured while uploading poster for title ${title.id} - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}` });
          } else {
            throw new E500(`An error occured while uploading poster for title ${title.id} - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`);
          }
        }
      } else if (type === 'upload_episode') {
        if (!caps.includes('root') && !caps.includes('seriesAdd')) throw new E403('You do not have access to uploading episodes');

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

        // Default ep instance
        const defaultEp: ITitleEpisodeDubbed = {
          framesURL: [],
          order: order,
          source: {
            q2k: null,
            q1080: '',
            q720: null,
            q480: null,
            q240: null,
          },
          subIDs: null
        };

        // Default dub instance
        let dub: ITitleEpisodesDub = {
          id: dubber.id,
          eps: [],
          include2K: false,
          includeSub: false,
        };

        if (title.dubs) {
          // Title dubs is not null

          const titleDub = title.dubs.find(el => el.id === dubID);

          if (titleDub) {
            // If dub exist set it as operational
            dub = titleDub;
          } else {
            // If dub not exist, create it
            title.dubs.push(dub);
          }
        } else {
          // Title dubs is null

          // Set dubs
          title.dubs = [dub];
        }

        if (dub.eps.find(el => el.order === order) && dub.eps.find(el => el.source.q1080)) {
          // Reject if episode exist
          throw new E400(`Episode ${episodeOrder} in ${dubber.name} is already exist`);
        } else {
          // Ep is not found. Push default
          dub.eps.push(defaultEp);
        }

        // Upload episode
        formData.set('type', 'video/title/episode');
        formData.set('qualities', JSON.stringify(qualities));

        try {
          const ep = dub.eps.find(el => el.order === order);

          // Upload
          const { data } = await axios.post<{ id: string, frames: number }>(`${config.microservices.uploadsURL}/v1/upload`, formData, { validateStatus: (s) => s < 500 });
          const id = data.id;
          const frames = data.frames;

          // Set sources
          ep!.source.q2k = qualities!.includes(1440) ? `${config.URL.media}/${id}_q_1440` : null;
          ep!.source.q1080 = `${config.URL.media}/${id}`;
          ep!.source.q720 = qualities!.includes(720) ? `${config.URL.media}/${id}_q_720` : null;
          ep!.source.q480 = qualities!.includes(480) ? `${config.URL.media}/${id}_q_480` : null;
          ep!.source.q240 = qualities!.includes(240) ? `${config.URL.media}/${id}_q_240` : null;

          // Set frames URLs
          let i = 0;

          while (i < frames) {
            ep!.framesURL!.push(`${config.URL.media}/${id}_f_${i}`);
            i++;
          }

          // Sort episodes in order
          dub.eps.sort((a, b) => a.order - b.order);
          title.markModified('dubs');

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

            return res.status(e.response?.data.code || 500).json({ msg: e.response?.data.msg || `An error occured while uploading poster for title ${title.id} - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}` });
          } else {
            throw new E500(`An error occured while uploading poster for title ${title.id} - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`);
          }
        }
      }


      return;
    }


    // titleEdit
    if (changeNames) await changeNamesHandler('titleEdit');
    if (editEpMeta) await editEpMetaHandler('titleEdit');
    if (setAgeRate) await setAgeRateHandler('titleEdit');
    if (setCountry) await setCountryHandler('titleEdit');
    if (setDescription) await setDescriptionHandler('titleEdit');
    if (setDetails) await setDetailsHandler('titleEdit');
    if (setEps) await setEpsHandler('titleEdit');
    if (setGenres) await setGenresHandler('titleEdit');
    if (setRating) await setRatingHandler('titleEdit');
    if (setSeason) await setSeasonHandler('titleEdit');
    if (setStatus) await setStatusHandler('titleEdit');
    if (setStudios) await setStudiosHandler('titleEdit');
    if (setType) await setTypeHandler('titleEdit');
    if (setYear) await setYearHandler('titleEdit');

    // seriesDelete
    if (deleteEpisode) await deleteEpisodeHandler('seriesDelete');

    try {
      await title.save();
    } catch (e) {
      // ignore
    }

    if (devMode) console.log(`Title patched. Changes - ${changes.join(', ')}`);

    return res.status(200).json({ msg: 'ok', changes: changes.length ? changes : `Nothing changed...` });



    // Handlers
    async function changeNamesHandler(requiredCap: TRoleCapability) {
      const handlerName = '[ChangeNames]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);

      if (changeNames?.ukr) {
        changes.push(`${handlerName}: Name changed (ukr): ${title.names.ukr} > ${changeNames.ukr.trim()}`);
        title.names.ukr = changeNames.ukr.trim();
      }

      if (changeNames?.eng) {
        const newName = changeNames.eng.trim();
        const code = urlSlugConvert(newName, {
          camelCase: true,
          separator: '-'
        });

        changes.push(`${handlerName}: Name changed (eng): ${title.names.eng} > ${newName}`);
        changes.push(`${handlerName}: Code changed - ${title.code} > ${code}`);
        title.names.eng = newName;
        title.code = code;

        title.markModified('code');
      }

      if (changeNames?.alt) {
        changes.push(`${handlerName}: Names changed (alt): ${title.names!.alt?.join(', ')} > ${changeNames.alt.map(el => el.trim()).join(', ')}`);
        title.names.alt = changeNames.alt.map(el => el.trim());
      }

      title.markModified('names');
    }

    async function setAgeRateHandler(requiredCap: TRoleCapability) {
      const handlerName = '[SetAgeRate]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);



      // Hardcoded, setAgeRate can be any string
      if (!AnimeAgeRates.includes(setAgeRate! as TAnimeAgeRate)) throw new E400(`${handlerName}: Age rate ${setAgeRate} is invalid`);

      changes.push(`${handlerName}: Age rate changed - ${title.ageRate} > ${setAgeRate}`);
      title.ageRate = setAgeRate as TAnimeAgeRate;

      title.markModified('ageRate');
    }

    async function setCountryHandler(requiredCap: TRoleCapability) {
      const handlerName = '[SetCountry]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);



      const acceptableCountries = ['japan', 'china', 'south corea'];
      if (!acceptableCountries.includes(setCountry!)) throw new E400(`${handlerName}: Country ${setCountry} is not acceptable${devMode && 'See docs about this endpoint. Acceptable countries are hardcoded at controllers/title.ts/setAgeRateHandler'}`);

      changes.push(`${handlerName}: Country changed - ${title.country} > ${setCountry}`);
      title.country = setCountry!;

      title.markModified('country');
    }

    async function setDescriptionHandler(requiredCap: TRoleCapability) {
      const handlerName = '[SetDescription]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);



      if (setDescription!.trim().length > 5000) throw new E400(`${handlerName}: Description can not be longer than 5 thousand symbols`);

      changes.push(`${handlerName}: Description changed`);
      title.description = setDescription!.trim();

      title.markModified('description');
    }

    async function setDetailsHandler(requiredCap: TRoleCapability) {
      const handlerName = '[SetDetails]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);



      if (setDetails!.trim().length > 2000) throw new E400(`${handlerName}: Details can not be longer than 2 thousand symbols`);

      changes.push(`${handlerName}: Details changed`);
      title.details = setDetails!.trim();

      title.markModified('details');
    }

    async function setEpsHandler(requiredCap: TRoleCapability) {
      const handlerName = '[SetEps]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);



      if (isNaN(+setEps!)) throw new E400(`${handlerName}: Eps can not be NaN`);

      changes.push(`${handlerName}: Estimated eps changed - ${title.estimatedEps} > ${setEps}`);
      title.estimatedEps = +setEps!;

      title.markModified('estimatedEps');
    }

    async function setGenresHandler(requiredCap: TRoleCapability) {
      const handlerName = '[SetGenres]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);


      const genres: TAnimeGenre[] = [];

      if (!Array.isArray(setGenres)) throw new E400(`${handlerName}: SetGenres is not Array`);

      setGenres?.forEach(genre => {
        if (AnimeGenres.includes(genre as TAnimeGenre)) genres.push(genre as TAnimeGenre);
      });

      changes.push(`${handlerName}: Genres changed - ${title.genres.join(', ')} > ${genres.join(', ')}`);
      title.genres = genres;

      title.markModified('genres');
    }

    async function setRatingHandler(requiredCap: TRoleCapability) {
      const handlerName = '[SetRating]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);



      if (isNaN(+setRating!)) throw new E400(`${handlerName}: Rating can not be NaN`);

      if (setRating! < 0 || setRating! > 10) throw new E400('[SetRating]: Rating can not be lower than 0 or greater than 10');

      changes.push(`${handlerName}: Rating changed - ${title.rating} > ${setRating}`);
      title.rating = +setRating!;

      title.markModified('rating');
    }

    async function setSeasonHandler(requiredCap: TRoleCapability) {
      const handlerName = '[SetSeason]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);



      if (!AnimeSeasons.includes(setSeason as TAnimeSeason)) throw new E400(`${handlerName}: Seasion ${setSeason} is invalid`);

      changes.push(`${handlerName}: Season changed - ${title.season} > ${setSeason}`);
      title.season = setSeason as TAnimeSeason;

      title.markModified('season');
    }

    async function setStatusHandler(requiredCap: TRoleCapability) {
      const handlerName = '[SetStatus]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);



      if (!AnimeStatuses.includes(setStatus as TAnimeStatus)) throw new E400(`${handlerName}: Status ${setStatus} is invalid`);

      changes.push(`${handlerName}: Type changed - ${title.status} > ${setStatus}`);
      title.status = setStatus as TAnimeStatus;

      title.markModified('status');
    }

    async function setStudiosHandler(requiredCap: TRoleCapability) {
      const handlerName = '[SetStudios]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);



      if (!Array.isArray(setStudios)) throw new E400(`${handlerName}: SetStudios is not Array`);

      changes.push(`${handlerName}: Studio changed - ${title.studios.join(', ')} > ${setStudios.map(el => el.trim())}`);
      title.studios = setStudios.map(el => el.trim());

      title.markModified('studios');
    }

    async function setTypeHandler(requiredCap: TRoleCapability) {
      const handlerName = '[SetType]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);



      if (!TitleTypes.includes(setType as TTitleType)) throw new E400(`${handlerName}: Type ${setType} is invalid`);

      changes.push(`${handlerName}: Type changed - ${title.type} > ${setType}`);
      title.type = setType as TTitleType;

      title.markModified('type');
    }

    async function setYearHandler(requiredCap: TRoleCapability) {
      const handlerName = '[SetYear]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);



      if (isNaN(+setYear!)) throw new E400(`${handlerName}: Eps can not be NaN`);

      changes.push(`${handlerName}: Year changed - ${title.year} > ${setYear}`);
      title.year = +setYear!;

      title.markModified('year');
    }

    async function deleteEpisodeHandler(requiredCap: TRoleCapability) {
      const handlerName = '[DeleteEpisode]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);

      const { dubID, episodeOrder } = deleteEpisode as { episodeOrder?: string, dubID?: string };

      if (!dubID || !episodeOrder) throw new E400('Episode order and dub id are required');
      if (isNaN(+episodeOrder)) throw new E400('Episode order can not be NaN');

      const order = +episodeOrder;
      const dubber = await Dubbers.findOne({ id: dubID });

      // Reject if dub is not found
      if (!dubber) throw new E404(`Dub ${dubID} is not found`);

      const ep = title.dubs?.find(el => el.id === dubber.id)?.eps.find(el => el.order === order);

      if (!ep) throw new E404(`Episode ${order} is not found in ${dubber.name} dub`);

      try {
        const res = await axios.delete(`${config.microservices.uploadsURL}/v1/upload/${ep.source.q1080.split('/')[ep.source.q1080.split('/').length - 1]}`, { validateStatus: (s) => s < 500 });
        console.log(res);
      } catch (e) {
        if (e instanceof AxiosError) {
          if (e.code === 'ECONNREFUSED') {
            throw new E503('Animee-uploads is not available. Try in a few minutes');
          }

          throw e;
        } else {
          throw new E500(`An error occured while deleting episode ${order} in ${dubber.name} for ${title.id} - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`);
        }
      }

      changes.push(`${handlerName}: Episode ${order} in ${dubber.name} deleted`);
      title.dubs!.find(el => el.id === dubber.id)!.eps = title.dubs!.find(el => el.id === dubber.id)!.eps.filter(el => el.order !== order);

      if (!title.dubs!.find(el => el.id === dubber.id)!.eps.length) {
        changes.push(`${handlerName}: Dub ${dubID} deleted due to no episodes`);
        title.dubs = title.dubs!.filter(el => el.id !== dubID);
      }

      title.markModified('dubs');
    }

    async function editEpMetaHandler(requiredCap: TRoleCapability) {
      const handlerName = '[EditEpMeta]';

      if (!title) throw new E404(`Title ${id} is not found`);
      if (!caps.includes(requiredCap) && !caps.includes('root')) throw new E403(`You do not have access to ${handlerName}`);

      const { dateOut, names, order, action } = editEpMeta!;

      if (!dateOut || !names || !names.eng || !names.ukr || !order || !action) throw new E400('Date out, names, action and order are required');
      if (isNaN(+dateOut) || isNaN(+order)) throw new E400('Date out and order can not be NaN');

      if (!title.epsMeta) {
        title.epsMeta = [];
      }

      const ep = title.epsMeta!.find(el => el.order === order);
      title.markModified('epsMeta');

      if (action === 'add') {
        if (ep) throw new E400(`Ep ${order} is already exist`);
        changes.push(`${handlerName}: Meta for ${order} episode added`);

        title.epsMeta.push({
          dateOut,
          names: {
            eng: names.eng.trim(),
            ukr: names.ukr.trim(),
          },
          order,
        });
      } else if (action === 'delete') {
        if (!ep) throw new E400(`Ep ${order} is not exist`);
        changes.push(`${handlerName}: Meta for ${order} episode deleted`);

        title.epsMeta = title.epsMeta.filter(el => el.order !== order);
      } else if (action === 'edit') {
        if (!ep) throw new E400(`Ep ${order} is not exist`);
        changes.push(`${handlerName}: Meta for ${order} episode changed`);

        ep.dateOut = dateOut;
        ep.names = {
          eng: names.eng.trim(),
          ukr: names.ukr.trim(),
        };
      } else {
        throw new E400(`Action ${action} is invalid`);
      }
    }
  });
}



export async function deleteTitle(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    const { id } = req.params as { id: string };

    const title = await Title.findOne({ id });

    if (!title) throw new E404(`Title ${id} is not found`);

    await title.deleteOne();
  });
}
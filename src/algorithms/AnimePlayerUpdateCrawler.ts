import AdminDubberMapRepositoryClass from '~/repo/admin/AdminDubberMapRepository';
import AnimeRepository, { AnimeModel } from '~/repo/AnimeRepository';
import DTOService from '~/service/DataTransferService';
import Logger from '~/service/LoggerService';
import StackServiceClass from '~/service/StackService';
import arrayEqual from 'array-equal';
import ms from 'ms';
import { ADMIN_SLUG, IAdminDubberMapData } from '~/intf/IAdmin';
import { ANIME_STATUS, IAnimePlayer, IAnimePlayerTeam } from '~/intf/IAnime';
import { AshdiAPI } from '~/api/external/ashdi.api';
import { AshdiPlType, IAshdiEpisode, IAshdiSeason } from '~/intf/external-api/IAshdi.api';
import { MoonanimeAPI } from '~/api/external/moonanime.api';
import { NekoError } from '~/service/ExceptionService';
import { buffer2hash, getUTC, retrieveNumberFromString, sleep, trimString } from '~/utils/utils';



interface IUnifiedEpisode {
  episode: number
  dubber_name: string

  moonanime_vod?: string
  ashdi_vod?: string
  tortuga_vod?: string
}



class AnimePlayerPlayerClass extends AnimeModel {
  constructor(
    readonly dubbers: IAdminDubberMapData[]
  ) {
    super();
  }



  /** 
   * Preserve anime player
   * 
   * @returns {boolean} Wether new episodes have been pulled
   */
  async parse(): Promise<boolean> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Define content season & episode slice indexes
    const contentSeason = Number(String(this._doc?.content_season).split('.')[0]);
    const contentPart = Number(String(this._doc?.content_season).split('.')[1]);

    const parts = this._doc.imdb_id ? (await AnimeRepository.getMany({ imdb_id: this._doc.imdb_id })).filter(el => Number(String(el.content_season).split('.')[0]) === contentSeason) : [];
    const prequelParts = parts.filter(el => el.content_season! < this._doc!.content_season!);

    let minSliceIndex = 0;
    let maxSlideIndex = -1;

    prequelParts.forEach(el => minSliceIndex += el.episodes_total ?? 0);
    maxSlideIndex = minSliceIndex + (this._doc?.episodes_total ?? 0);

    const slice: number[] = [minSliceIndex, maxSlideIndex];



    // Retrieve episodes from players
    const episodes: IUnifiedEpisode[] = [];

    if (this._doc.mal_id) {
      const moon = await this.retrieveMoonanime(this._doc.mal_id, { slice });
      moon.forEach(el => episodes.push(el));
    }

    if (this._doc.imdb_id) {
      const ashdi = await this.retrieveAshdi(this._doc.imdb_id, { contentSeason, slice });
      ashdi.forEach(el => episodes.push(el));
    }



    // Map episodes to dubbers
    const mapped: Record<string, IUnifiedEpisode[]> = {};

    for (const key in episodes) {
      const episode = episodes[key];
      const slug = this.preserveSlug(episode.dubber_name);
      const existDubber = mapped[slug] as IUnifiedEpisode[];

      if (existDubber) {
        const existEpisode = existDubber.find(el => el.episode === episode.episode);

        if (existEpisode) {
          if (episode.ashdi_vod) existEpisode.ashdi_vod = episode.ashdi_vod;
          if (episode.moonanime_vod) existEpisode.moonanime_vod = episode.moonanime_vod;
          if (episode.tortuga_vod) existEpisode.tortuga_vod = episode.tortuga_vod;
        } else existDubber.push(episode);
      } else mapped[slug] = [episode];
    }



    // Assign mixed teams
    const mixed: ({ subtitles: boolean } & IAnimePlayerTeam)[] = [];

    for (const slug in mapped) {
      const episodes = mapped[slug];

      // Parse dubbersIds & subtitles
      const dubberSlugs = slug.split(/&|\+/g).map(trimString);
      const dubberIds: string[] = [];
      let subtitles = false;

      dubberSlugs.forEach(slug => {
        const dubber = this.getDubber(slug);
        if (dubber?.id) {
          dubberIds.push(dubber.id);

          if (dubber.subtitles) subtitles = true;
        } else dubberIds.push(`~notexist-${slug}`);
      });

      dubberIds.sort();

      // Re-define subtitles using dubber name
      if (!subtitles) {
        subtitles = dubberSlugs.some(el => el.match(/субтитри|SUB/gi));
      }



      // Assing episodes
      const existTeam = mixed.find(el => arrayEqual(el.dubber_ids, dubberIds) && el.subtitles === subtitles);

      if (existTeam) {
        existTeam.vods.forEach(vod => {
          const episode = episodes.find(el => el.episode === vod.episode);
          if (!episode) return;

          if (episode.ashdi_vod) vod.ashdi_vod = episode.ashdi_vod;
          if (episode.moonanime_vod) vod.moonanime_vod = episode.moonanime_vod;
          if (episode.tortuga_vod) vod.tortuga_vod = episode.tortuga_vod;
        });
      } else {
        const dubberName = episodes[0]?.dubber_name ?? 'Unknown';
        const id = buffer2hash(Buffer.from(dubberName));

        mixed.push({
          id,
          dubber_ids: dubberIds,
          dubber_name: dubberName,
          vods: episodes,
          subtitles,
        });
      }
    }



    // Filter mixed
    const dubbed: IAnimePlayerTeam[] = [];
    const subbed: IAnimePlayerTeam[] = [];

    mixed.forEach(el => {
      const team = DTOService.excludeKeys(el, ['subtitles']) as IAnimePlayerTeam;

      // Sort vods by episode
      team.vods.sort((a, b) => {
        if (a.episode > b.episode) return 1;
        else if (a.episode < b.episode) return -1;

        return 0;
      });

      if (el.subtitles) subbed.push(team);
      if (!el.subtitles) dubbed.push(team);
    });

    const player: IAnimePlayer = { dubbed, subbed };
    const playerHash = buffer2hash(Buffer.from(JSON.stringify(player)));
    const oldPlayerHash = buffer2hash(Buffer.from(JSON.stringify(this._doc.player)));



    this._set('episodes_synced_at', getUTC().ISO);
    this._set('player', player);

    await this.save();

    return playerHash !== oldPlayerHash;
  }



  private async retrieveMoonanime(malId: number, params: { slice: number[] }): Promise<IUnifiedEpisode[]> {
    try {
      const episodes = await MoonanimeAPI.getEpisodes(malId);
      const unified: IUnifiedEpisode[] = [];
      const minSliceIndex = params.slice[0];



      episodes.forEach(episode => {
        episode.videos.forEach(vod => {
          let retrievedEpisode = episode.episode;
          if (retrievedEpisode < minSliceIndex) retrievedEpisode = minSliceIndex + 1; // Ensure that episode cannot be less than minSliceIndex

          const order = retrievedEpisode - minSliceIndex;

          unified.push({
            episode: order,
            dubber_name: trimString(vod.studio),
            moonanime_vod: vod.video_url,
          });
        });
      });

      return unified;
    } catch (e) {
      Logger.error(`[AnimePlayerPlayerClass]: Cannot parse moonanime episodes`, e);

      return [];
    }
  }



  private async retrieveAshdi(imdbId: string, params: { contentSeason: number, slice: number[] }): Promise<IUnifiedEpisode[]> {
    const minSliceIndex = params.slice[0];
    const maxSliceIndex = params.slice[1];

    try {
      const response = await AshdiAPI.getTitle(imdbId);
      const dubbers: AshdiPlType[] = response.pl;
      const unified: IUnifiedEpisode[] = [];



      dubbers.forEach(dubber => {
        // Movies
        if ('title2' in dubber) {
          unified.push({
            episode: 1,
            dubber_name: trimString(dubber.title2),
            ashdi_vod: dubber.url,
          });
        }

        // Serials
        if ('folder' in dubber) {
          dubber.folder.filter(dubberFolderFilter).forEach(season => {
            season.folder.filter(seasonFolderFilter).forEach(episode => {
              let retrievedEpisode = retrieveNumberFromString(episode.title) || 1; // Retrieve episode from title
              if (retrievedEpisode < minSliceIndex) retrievedEpisode = minSliceIndex + 1; // Ensure that episode cannot be less than minSliceIndex

              const order = retrievedEpisode - minSliceIndex;

              unified.push({
                episode: order,
                dubber_name: trimString(dubber.title),
                ashdi_vod: `https://ashdi.vip/vod/${episode.id}`,
              });
            });
          });
        }
      });

      return unified;
    } catch (e) {
      Logger.error(`[AnimePlayerPlayerClass]: Cannot parse ashdi episodes`, e);

      return [];
    }



    function dubberFolderFilter(season: IAshdiSeason) {
      return retrieveNumberFromString(season.title) === params.contentSeason;
    }

    function seasonFolderFilter(episode: IAshdiEpisode) {
      const order = retrieveNumberFromString(episode.title) || 1;

      return order > minSliceIndex && order < maxSliceIndex + 1;
    }
  }



  private getDubber(slug: string): { id: string | null, subtitles: boolean } | null {
    for (const key in this.dubbers) {
      const dubber = this.dubbers[key];

      if (dubber.synonyms.includes(slug)) return { id: dubber.dubber_id, subtitles: dubber.subtitles };
    }

    return null;
  }



  private preserveSlug(text: string): string {
    return trimString(text)
      .toLowerCase()
      .replace('субтитри | ', 'субтитри ')
      .replace('amp;', '');
  }
}



class AnimePlayerUpdateCrawlerClass {
  private dubbers: IAdminDubberMapData[] = [];
  private service: StackServiceClass<string>;



  constructor() {
    this.service = new StackServiceClass('AnimePlayerUpdateCrawler', async (...props) => await this.job(...props));
  }



  async reset() {
    Logger.debug(`[AnimePlayerUpdateCrawler]: Reset performed`);

    this.service.dropAll();



    const ongoings = await AnimeRepository.getSortedMany({
      $or: [
        { mal_id: { $ne: null } },
        { imdb_id: { $ne: null } },
      ],
      status: ANIME_STATUS.ONGOING,
    }, { sort: { episodes_synced_at: 'ascending' }, limit: 50 });

    const finished = await AnimeRepository.getSortedMany({
      $or: [
        { mal_id: { $ne: null } },
        { imdb_id: { $ne: null } },
      ],
      status: ANIME_STATUS.FINISHED,
    }, { sort: { episodes_synced_at: 'ascending' }, limit: 50 });



    ongoings.forEach(document => this.service.append(document.id, { doNotRun: true }));
    finished.forEach(document => this.service.append(document.id, { doNotRun: true }));

    this.service.run();
  }



  async updateDubbersMap() {
    const admin = new AdminDubberMapRepositoryClass();
    const dubbers = await admin.getOne({ slug: ADMIN_SLUG.DUBBERS_MAP });

    this.dubbers = dubbers.data;
  }



  async syncAnimePlayer(id: string) {
    try {
      const parser = new AnimePlayerPlayerClass(this.dubbers);
      await parser.init({ id });
      const areNewEpisodesPulled = await parser.parse();

      if (areNewEpisodesPulled) Logger.debug(`[AnimePlayerUpdateCrawler]: Episodes for anime "${id}" retrieved`);
    } catch (e) {
      Logger.error(`[AnimePlayerUpdateCrawler]: Cannot parse episodes for anime "${id}"`, e);
    }
  }



  private async job(id: string) {
    await this.syncAnimePlayer(id);

    // Throttle
    await sleep(ms('2 sec'));
  }
}



const AnimePlayerUpdateCrawler = new AnimePlayerUpdateCrawlerClass();

export default AnimePlayerUpdateCrawler;
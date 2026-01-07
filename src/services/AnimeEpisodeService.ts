import AdminDubberMapRepositoryClass from '~/repo/admin/AdminDubberMapRepository';
import DTOService from './DataTransferService';
import Logger from './LoggerService';
import arrayEqual from 'array-equal';
import { ADMIN_SLUG, IAdminDubberMapData } from '~/intf/IAdmin';
import { AnimeModel } from '~/repo/AnimeRepository';
import { AshdiAPI } from '~/api/external/ashdi.api';
import { IAnimePlayerTeam } from '~/intf/IAnime';
import { IAshdiDubber } from '~/intf/external-api/IAshdi.api';
import { MoonanimeAPI } from '~/api/external/moonanime.api';
import { NekoError } from './ExceptionService';
import { retrieveNumberFromString, trimString } from '~/utils/utils';



interface IUnifiedEpisode {
  episode: number
  dubber_name: string

  moonanime_vod?: string
  ashdi_vod?: string
  tortuga_vod?: string
}



class EpisodeParserClass extends AnimeModel {
  constructor(
    readonly dubbers: IAdminDubberMapData[]
  ) {
    super();
  }



  /**
   * Retrieve episodes from providers
   */
  async retrieve() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
    if (!this._doc.mal_id && !this._doc.imdb_id) return; // Skip if neither mal_id nor imdb_id specified

    /** Retrieved episodes from players */
    const episodes: IUnifiedEpisode[] = [];

    if (this._doc.mal_id) {
      const eps = await this.retrieveMoonanime(this._doc.mal_id);
      eps.forEach(el => episodes.push(el));
    }

    if (this._doc.imdb_id) {
      const eps = await this.retrieveAshdi(this._doc.imdb_id);
      eps.forEach(el => episodes.push(el));
    }



    /** Episodes mapped to dubbers */
    const sorted: Record<string, IUnifiedEpisode[]> = {};

    for (const key in episodes) {
      const episode = episodes[key];
      const slug = this.preserveSlug(episode.dubber_name);
      const existDubber = sorted[slug] as IUnifiedEpisode[];

      if (existDubber) {
        const existEpisode = existDubber.find(el => el.episode === episode.episode);

        if (existEpisode) {
          if (episode.ashdi_vod) existEpisode.ashdi_vod = episode.ashdi_vod;
          if (episode.moonanime_vod) existEpisode.moonanime_vod = episode.moonanime_vod;
          if (episode.tortuga_vod) existEpisode.tortuga_vod = episode.tortuga_vod;
        } else existDubber.push(episode);
      } else sorted[slug] = [episode];
    }



    const mixed: ({ subtitles: boolean } & IAnimePlayerTeam)[] = [];
    const dubbed: IAnimePlayerTeam[] = [];
    const subbed: IAnimePlayerTeam[] = [];



    // Assign mixed teams
    for (const slug in sorted) {
      const episodes = sorted[slug];

      // Parse dubbersIds & subtitles
      const dubberSlugs = slug.split(/&|\+/g).map(trimString);
      const dubberIds: string[] = [];
      let subtitles = false;

      dubberSlugs.forEach(slug => {
        const dubber = this.getDubber(slug);
        if (dubber?.id) {
          dubberIds.push(dubber.id);

          if (dubber.subtitles) subtitles = true;
        }
      });

      dubberIds.sort();



      // Assing episodes
      const existTeam = mixed.find(el => arrayEqual(el.dubber_ids, dubberIds));

      if (existTeam) {
        existTeam.vods.forEach(vod => {
          const episode = episodes.find(el => el.episode === vod.episode);
          if (!episode) return;

          if (episode.ashdi_vod) vod.ashdi_vod = episode.ashdi_vod;
          if (episode.moonanime_vod) vod.moonanime_vod = episode.moonanime_vod;
          if (episode.tortuga_vod) vod.tortuga_vod = episode.tortuga_vod;
        });
      } else {
        mixed.push({
          subtitles,
          dubber_ids: dubberIds,
          dubber_name: slug,
          vods: episodes,
        });
      }
    }



    // Filter mixed
    mixed.forEach(el => {
      const team = DTOService.excludeKeys(el, ['subtitles']) as IAnimePlayerTeam;

      if (el.subtitles) subbed.push(team);
      if (!el.subtitles) dubbed.push(team);
    });



    this._set('player', { dubbed, subbed });

    await this.save();
  }



  private async retrieveMoonanime(malId: number): Promise<IUnifiedEpisode[]> {
    const episodes = await MoonanimeAPI.getEpisodes(malId);
    const unified: IUnifiedEpisode[] = [];



    episodes.forEach(ep => {
      ep.videos.forEach(video => {
        const episode: IUnifiedEpisode = {
          episode: ep.episode,
          dubber_name: trimString(video.studio),
          moonanime_vod: video.video_url,
        };

        unified.push(episode);
      });
    });

    return unified;
  }



  private async retrieveAshdi(imdbId: string): Promise<IUnifiedEpisode[]> {
    const response = await AshdiAPI.getTitle(imdbId);
    const dubbers: IAshdiDubber[] = response.pl;
    const unified: IUnifiedEpisode[] = [];

    dubbers.forEach(dubber => {
      dubber.folder.forEach(season => {
        season.folder.forEach(episode => {
          unified.push({
            episode: retrieveNumberFromString(episode.title),
            dubber_name: trimString(dubber.title),
            ashdi_vod: `https://ashdi.vip/vod/${episode.id}`,
          });
        });
      });
    });



    return unified;
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
      .replace('субтитри | ', '')
      .replace('amp;', '');
  }
}



class AnimeEpisodeServiceClass {
  private dubbers: IAdminDubberMapData[] = [];



  async updateDubbersMap() {
    const admin = new AdminDubberMapRepositoryClass();
    const dubbers = await admin.getOne({ slug: ADMIN_SLUG.DUBBERS_MAP });

    this.dubbers = dubbers.data;
  }



  async invoke(id: string) {
    try {
      const parser = new EpisodeParserClass(this.dubbers);
      await parser.init({ id });
      await parser.retrieve();

      Logger.info(`[AnimeEpisodeService]: Episodes for anime "${id}" retrieved`);
    } catch (e) {
      Logger.error(`[AnimeEpisodeService]: Cannot parse episodes for anime "${id}"`, e);
    }
  }
}



const AnimeEpisodeService = new AnimeEpisodeServiceClass();

export default AnimeEpisodeService;
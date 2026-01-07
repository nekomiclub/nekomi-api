import AdminDubberMapRepositoryClass from '~/repo/admin/AdminDubberMapRepository';
import Logger from './LoggerService';
import { ADMIN_SLUG, AdminDubberMapDataType } from '~/intf/IAdmin';
import { AnimeModel } from '~/repo/AnimeRepository';
import { AshdiAPI } from '~/api/external/ashdi.api';
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
    readonly dubbers: AdminDubberMapDataType
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
      const slug = this.preserveKey(episode.dubber_name);
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



    // // Parse unified to dubbers
    // const dubbers: IAnimeDubber[] = [];

    // for (const slug in sortedUnified) {
    //   const unified = sortedUnified[slug];
    //   const dubber = this.getDubber(slug);
    //   if (!dubber) {
    //     Logger.warn(`[EpisodeParser]: Cannot find dubber for slug "${slug}"`);

    //     continue;
    //   }

    //   const episodes: IAnimeEpisode[] = unified.map(el => {
    //     return {
    //       episode: el.episode,
    //       ashdi: el.ashdi ?? null,
    //       moonanime: el.moonanime ?? null,
    //       tortuga: el.moonanime ?? null,
    //     } satisfies IAnimeEpisode;
    //   });



    //   dubbers.push({
    //     dubber_id: dubber.id,
    //     episodes_dub: dubber.subtitles ? [] : episodes,
    //     episodes_sub: dubber.subtitles ? episodes : []
    //   });
    // }



    // // console.log(dubbers);

    // this.set('episodes', dubbers);

    // await this.save();
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



  private getDubber(name: string): { id: string, subtitles: boolean } | null {
    for (const id in this.dubbers) {
      const dubber = this.dubbers[id];

      if (dubber.synonyms_dub.includes(name)) return { id, subtitles: false };
      if (dubber.synonyms_sub.includes(name)) return { id, subtitles: true };
    }

    return null;
  }



  private preserveKey(text: string): string {
    return trimString(text)
      .toLowerCase()
      .replace('субтитри | ', '')
      .replace('amp;', '');
  }
}



class AnimeEpisodeServiceClass {
  private dubbers: AdminDubberMapDataType = {};



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
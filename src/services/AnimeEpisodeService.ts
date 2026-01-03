import AdminDubberMapRepositoryClass from '~/repo/admin/AdminDubberMapRepository';
import Logger from './LoggerService';
import { ADMIN_SLUG, AdminDubberMapDataType } from '~/intf/IAdmin';
import { AnimeModel } from '~/repo/AnimeRepository';
import { IAnimeDubber, IAnimeEpisode } from '~/intf/IAnime';
import { MoonanimeAPI } from '~/api/external/moonanime.api';
import { NekoError } from './ExceptionService';
import { trimString } from '~/utils/utils';



interface IUnifiedEpisode {
  episode: number
  dubber_name: string
  moonanime_vod: string | null
  ashdi_vod: string | null
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
    if (!this._doc.mal_id && !this._doc.imdb_id) return; // Skip if neither mal_id not imdb_id specified

    // Retrieve episodes
    const retrievedUnified: IUnifiedEpisode[] = [];

    if (this._doc.mal_id) {
      const eps = await this.retrieveMoonanime(this._doc.mal_id);
      eps.forEach(el => retrievedUnified.push(el));
    }



    // Parse episodes into dubber groups
    const sortedUnified: Record<string, IUnifiedEpisode[]> = {};

    for (const key in retrievedUnified) {
      const episode = retrievedUnified[key];
      const slug = trimString(episode.dubber_name).toLowerCase();

      if (sortedUnified[slug]) sortedUnified[slug].push(episode);
      else sortedUnified[slug] = [episode];
    }



    // Parse unified to dubbers
    const dubbers: IAnimeDubber[] = [];

    for (const slug in sortedUnified) {
      const unified = sortedUnified[slug];
      const dubber = this.getDubber(slug);
      if (!dubber) {
        Logger.warn(`[EpisodeParser]: Cannot find dubber for slug "${slug}"`);

        continue;
      }

      const episodes: IAnimeEpisode[] = unified.map(el => {
        return {
          episode: el.episode,
          ashdi_vod: el.ashdi_vod,
          moonanime_vod: el.moonanime_vod,
        } satisfies IAnimeEpisode;
      });



      dubbers.push({
        dubber_id: dubber.id,
        episodes_dub: dubber.subtitles ? [] : episodes,
        episodes_sub: dubber.subtitles ? episodes : []
      });
    }



    this.set('episodes', dubbers);

    await this.save();
  }



  private async retrieveMoonanime(mal_id: number): Promise<IUnifiedEpisode[]> {
    const episodes = await MoonanimeAPI.getEpisodes(mal_id);
    const unified: IUnifiedEpisode[] = [];



    episodes.forEach(ep => {
      ep.videos.forEach(video => {
        const episode: IUnifiedEpisode = {
          episode: ep.episode,
          dubber_name: video.studio,
          moonanime_vod: video.video_url,
          ashdi_vod: null,
        };

        unified.push(episode);
      });
    });

    return unified;
  }



  /** @todo */
  private async retrieveAshdi(imdb_id: string) {
    throw new NekoError('sys:not_implemented');
  }



  private getDubber(name: string): { id: string, subtitles: boolean } | null {
    for (const id in this.dubbers) {
      const dubber = this.dubbers[id];

      if (dubber.synonyms_dub.includes(name)) return { id, subtitles: false };
      if (dubber.synonyms_sub.includes(name)) return { id, subtitles: true };
    }

    return null;
  }
}



export default class AnimeEpisodeServiceClass {
  private dubbers: AdminDubberMapDataType = {};



  async update() {
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
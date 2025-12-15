import AnimeRepository, { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import IAnime, { ANIME_GENRE, IAnimeRelation, IAnimeSchedule, IAnimeStudio } from '~/intf/IAnime';
import Logger from '~/service/LoggerService';
import { Hikka } from '~/api/external/hikka.api';
import { IHikkaGenre, IHikkaScheduleItem } from '~/intf/external-api/IHikka.api';
import { IJikanMalEntity, IJikanRelation } from '~/intf/external-api/IJikan.api';
import { Jikan } from '~/api/external/jikan.api';
import { getUTC } from '~/utils/utils';



let UPDATE_YEAR = getUTC().year;



/**
 * Anime bulk update algorithm
 * 
 * Steps:
 * 1. Find anime document without malId specified
 * 2. Pull anime document from hikka using hikka slug, retrieve malId & etc
 * 3. Pull anime document from myanimelist using malId, retrieve episodes meta, relations, temporary poster, etc
 * 4. Pull imdbId if not specified
 * 5. Pull uaposters & upload hero poster, if not set mal poster as hero
 * 6. Pull ashdi episodes
 */
export default async function AnimeBulkUpdate() {
  try {
    const document = await AnimeRepository.getOneByQuery<IAnime>({ mal_id: null, hikka_slug: { $ne: null }, year: UPDATE_YEAR });
    if (!document) return UPDATE_YEAR -= 1;

    const animeService = new AnimeRepositoryClass();
    await animeService.init(document.id);

    let hikkaPosterUrl: string | null = null;

    // * Pull hikka
    try {
      const hikkaRes = await Hikka.getAnime(document.hikka_slug!);

      animeService.setMalId(hikkaRes.mal_id);

      await animeService.setTitle({ title_en: hikkaRes.title_en, title_ja: hikkaRes.title_ja, title_ua: hikkaRes.title_ua, synonyms: hikkaRes.synonyms });

      animeService.setSynopsis({ synopsis_en: hikkaRes.synopsis_en, synopsis_ua: hikkaRes.synopsis_ua });
      animeService.setEpisodesReleased(hikkaRes.episodes_released);
      animeService.setEpisodesTotal(hikkaRes.episodes_total);

      animeService.setType(animeService.parseType(hikkaRes.media_type));
      animeService.setStatus(animeService.parseStatus(hikkaRes.status));
      animeService.setSeason(animeService.parseSeason(hikkaRes.season));
      animeService.setRating(animeService.parseRating(hikkaRes.rating));

      animeService.setScore({ score: hikkaRes.score, scoredBy: hikkaRes.scored_by });
      animeService.setYear(hikkaRes.year);

      // Parse genres
      const genres = parseHikkaGenres(hikkaRes.genres);
      if (genres.length) animeService.setGenres(genres);

      // Parse schedule
      const schedule = parseHikkaSchedule(hikkaRes.schedule);
      if (schedule.length) animeService.setSchedule(schedule);

      animeService.setSync('hikka_sync', getUTC().ISO);

      hikkaPosterUrl = hikkaRes.image;
    } catch (e) {
      Logger.warn(`[AnimeBulkUpdate]: Hikka update failed, skipping... [id: ${document.id}]`, e);
    }



    // * Pull myanimelist (jikan)
    try {
      const jikanRes = await Jikan.getAnime(document.mal_id!);

      // Parse studios
      const studios = parseJikanStudios(jikanRes.studios);
      if (studios.length) animeService.setStudios(studios);

      // Parse relations
      const relations = parseJikanRelations(jikanRes.relations);
      if (relations.length) animeService.setRelations(relations);

      animeService.setSync('myanimelist_sync', getUTC().ISO);
    } catch (e) {
      Logger.warn(`[AnimeBulkUpdate]: MyAnimeList update failed, skipping... [id: ${document.id}]`, e);
    }



    // * Pull imdb
    try {
      if (document.imdb_id) return;

      // TODO: Pull id from ids.moe, if not exist, pull https://raw.githubusercontent.com/Fribb/anime-lists/refs/heads/master/anime-list-full.json, cache and use it, if not pass by
    } catch (e) {
      Logger.warn(`[AnimeBulkUpdate]: IMDB update failed, skipping... [id: ${document.id}]`, e);
    }



    // * Pull uaposters
    try {
      // TODO: Pull https://raw.githubusercontent.com/DrBryanMan/UAPosters/refs/heads/main/PostersList.json, cache and use it

      Logger.warn(`[AnimeBulkUpdate]: UAPosters update is not yet implemented, skipping... [id: ${document.id}]`);
    } catch (e) {
      Logger.warn(`[AnimeBulkUpdate]: UAPosters update failed, skipping... [id: ${document.id}]`, e);
    }



    // * Pull ashdi
    try {
      Logger.warn(`[AnimeBulkUpdate]: Ashdi update is not yet implemented, skipping... [id: ${document.id}]`);
    } catch (e) {
      Logger.warn(`[AnimeBulkUpdate]: Ashdi update failed, skipping... [id: ${document.id}]`, e);
    }



    console.log(animeService.document);
    // await animeService.save();

    Logger.info(`[AnimeBulkUpdate]: Anime document bulk update succeeded. [id: ${document.id}]`);
  } catch (e) {
    Logger.error(`[AnimeBulkUpdate]: Cannot update the document`, e);
  }
}



function parseHikkaGenres(input: IHikkaGenre[]): ANIME_GENRE[] {
  const genres: ANIME_GENRE[] = [];

  input?.forEach(genre => {
    console.log(genre);
    if (Object.values(ANIME_GENRE).includes(genre.slug.toLowerCase() as ANIME_GENRE)) genres.push(genre.slug.toLowerCase() as ANIME_GENRE);
  });

  return genres;
}

function parseHikkaSchedule(input: IHikkaScheduleItem[]): IAnimeSchedule[] {
  const schedule: IAnimeSchedule[] = [];

  input.forEach(item => {
    schedule.push({ episode: item.episode, airing_at: getUTC(item.date * 1000).ISO });
  });

  return schedule;
}

function parseJikanStudios(input: IJikanMalEntity[]): IAnimeStudio[] {
  const studios: IAnimeStudio[] = [];

  input.forEach(item => studios.push({ mal_id: item.mal_id, name: item.name }));

  return studios;
}

function parseJikanRelations(input: IJikanRelation[]): IAnimeRelation[] {
  const relations: IAnimeRelation[] = [];

  input.forEach(relation => {
    relation.entry.forEach(item => relations.push({ mal_id: item.mal_id, type: item.type, relation: relation.relation }));
  });

  return relations;
}
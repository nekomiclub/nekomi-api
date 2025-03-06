import AnimeModel from '~/core/models/AnimeModel';
import AnimeService from '~/core/services/AnimeService';
import DubberModel from '~/core/models/DubberModel';
import Search from '~/services/SearchService';
import TitleModel from '~/models/Title';
import { ANIME_GENRES, ANIME_MEDIA_TYPE, ANIME_MEDIA_TYPES, ANIME_RATE, ANIME_RATES, ANIME_SEASONS, Anime, AnimeGenre, AnimeMedia, AnimeMetadata, AnimeRate, AnimeRelated, AnimeSeason } from '~/interfaces/Anime.intf';
import { AnimeMetadataMapper, AnimeRelatedMapper, DubberMetadataMapper } from '~/utils/data-mappers';
import { DocumentDTO, MongoDocumentDTO } from '~/core/services/DTO';
import { DubberMetadata } from '~/core/interfaces/Dubber.intf';
import { E401 } from '~/services/ErrorService';
import { MiddlewareService } from '~/services/MiddlewareService';
import { config } from '~/config';



//* ===================================== GET SEARCH
export interface AnimeGetSearch {
  /** 
   * Query ~all will return all anime documents
   * Query ~wo-mal-id will return anime documents where mal_id: null
  */
  q: string
}

export interface AnimeGetSearchResult {
  anime: Anime
}

async function GetSearch({ q }: AnimeGetSearch) {
  const limit = 15;

  let animeResults: Anime[] = [];

  if (q === '~all') {
    // Get all
    animeResults = (await TitleModel.find()).slice(0, limit).map(el => new MongoDocumentDTO().anime({ document: el, details: true }));
  } else if (q === '~wo-mal-id') {
    // Get all without mail id
    animeResults = (await TitleModel.find({ mal_id: null })).slice(0, limit).map(el => new MongoDocumentDTO().anime({ document: el, details: true }));
  } else {
    animeResults = Search.search({ query: q, engine: 'anime', limit });
  }

  const results: AnimeGetSearchResult[] = [];

  animeResults.forEach(anime => {
    results.push({
      anime: new DocumentDTO().anime({ object: anime }),
    });
  });

  return {
    status: 200,
    message: 'ok',
    results
  };
}

//* ===================================== GET ALL
export interface AnimeGetAll {
  total: number

  /** With malId and country */
  fullfilled: number

  /** With country only */
  updated: number
}

async function GetAll(): Promise<AnimeGetAll> {
  const animeService = new AnimeService();
  const documents = await animeService.getAll();

  const total = documents.length;
  // All parsed anime documents by default were with G rate and OVA status
  const updated = documents.filter(el => el.rate !== ANIME_RATE.G && el.media === ANIME_MEDIA_TYPE.OVA);
  const fullfilled = updated.filter(el => el.malId !== null);

  return {
    total,
    updated: updated.length,
    fullfilled: fullfilled.length
  };
}

//* ===================================== GET BY QUERY
export interface AnimeGetByQueryProps {
  query: string

  /** Return only metadata. Will set anime object to null */
  metadataOnly?: boolean

  /** Return detailed document. Require valid CSRF */
  detailed?: boolean

  CSRF_Token?: string

  fetchDubbers?: boolean
  fetchRelated?: boolean
}

export interface AnimeGetByQuery {
  /** Will be null only when metadataOnly = true */
  anime: Anime | null

  genres: AnimeGenre[] | null
  media: AnimeMedia | null
  rate: AnimeRate | null
  season: AnimeSeason | null

  related?: AnimeRelated[]
  dubbers?: DubberMetadata[]
  metadata?: AnimeMetadata
}

async function GetByQuery({ query, metadataOnly, detailed, CSRF_Token, fetchDubbers, fetchRelated }: AnimeGetByQueryProps): Promise<AnimeGetByQuery> {
  const animeService = new AnimeService();
  let withDetails = false;

  //* Handle withDetails
  if (detailed) {
    if (!CSRF_Token) throw new E401(`CSRF token is required to get detailed document`);
    await new MiddlewareService().checkCSRF(CSRF_Token, [config.DOMAIN.nekomi]);

    withDetails = true;
  }

  // TODO: Sync with myanimelist

  let anime = await animeService.getByQuery(query, true);



  let genres: AnimeGetByQuery['genres'] = null;
  let rate: AnimeGetByQuery['rate'] = null;
  let media: AnimeGetByQuery['media'] = null;
  let season: AnimeGetByQuery['season'] = null;

  let related: AnimeGetByQuery['related'] = undefined;
  let dubbers: AnimeGetByQuery['dubbers'] = undefined;

  let metadata: AnimeGetByQuery['metadata'] = undefined;



  //* Handle metadataOnly
  if (metadataOnly) {
    metadata = AnimeMetadataMapper(anime);
  }

  //* Handle withDetails, fetchDubbers, fetchRelated
  if (withDetails && !metadataOnly) {
    genres = anime.genresNew.map(slug => ANIME_GENRES[slug]);
    rate = ANIME_RATES[anime.rate];
    media = ANIME_MEDIA_TYPES[anime.media];
    season = ANIME_SEASONS[anime.seasonNew];

    if (fetchDubbers) {
      const uniqueDubberIDs: string[] = [];

      anime.episodes.forEach(episode => {
        if (!uniqueDubberIDs.includes(episode.dubberID)) uniqueDubberIDs.push(episode.dubberID);
      });

      const results = await DubberModel.find({ $or: uniqueDubberIDs.map(el => { return { id: el }; }) });
      dubbers = results.map(dubber => DubberMetadataMapper(new MongoDocumentDTO().dubber({ document: dubber })));
    }

    if (fetchRelated) {
      const results = await AnimeModel.find({ $or: anime.related.map(el => { return { id: el }; }) });
      related = results.map(anime => AnimeRelatedMapper(new MongoDocumentDTO().anime({ document: anime })));
    }
  }

  if (!withDetails) {
    anime = new DocumentDTO().anime({ object: anime });
  }


  return {
    anime: metadataOnly ? null : anime,

    genres: genres,
    rate: rate,
    media: media,
    season: season,

    dubbers,
    related,
    metadata,
  };
}





export default class AnimeController {
  static GetSearch = GetSearch;
  static GetAll = GetAll;
  static GetByQuery = GetByQuery;
}
import Search from '~/services/SearchService';
import TitleModel from '~/models/Title';
import { Anime } from '~/interfaces/Anime.intf';
import { DocumentDTO, MongoDocumentDTO } from '~/core/services/DTO';



//* ===================================== GET SEARCH
export interface IAnimeGetSearch {
  /** Query ~all will return all anime's */
  q: string
}

export interface IAnimeGetSearchResult {
  anime: Anime
}

async function GetSearch({ q }: IAnimeGetSearch) {
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

  const results: IAnimeGetSearchResult[] = [];

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




export default class AnimeController {
  static GetSearch = GetSearch;
}
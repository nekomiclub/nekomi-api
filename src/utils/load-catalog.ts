import Logger from '~/service/LoggerService';
import fs from 'fs';
import { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import { ErrorConstructor } from '~/service/ExceptionService';



interface IHikkaAnime {
  data_type: string
  media_type: string
  title_ua: string
  title_en: string
  title_ja: string
  episodes_released: number
  episodes_total: number
  image: string
  status: string
  native_scored_by: number
  native_score: number
  scored_by: number
  score: number
  slug: string
  start_date: number
  end_date: number
  translated_ua: boolean
  season: string
  source: string
  rating: string
  year: number
  watch: any[]
}



export default async function LoadCatalog() {
  try {
    const PATH = './data/catalog.json';
    if (!fs.existsSync(PATH)) throw new ErrorConstructor(`lc:file_not_exist', 'Catalog file is not exist at "${PATH}"`);

    const catalog = JSON.parse(fs.readFileSync(PATH).toString()) as IHikkaAnime[];

    catalog.slice(0, 5).forEach(async item => {
      const as = new AnimeRepositoryClass();

      await as.create({ saveDocument: false });
    });
  } catch (e) {
    Logger.error(`[LoadCatalog]: An error occured while loading catalog`, e);
  }
}
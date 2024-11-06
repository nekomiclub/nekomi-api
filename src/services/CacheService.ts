import { config } from '../config';
import { ICacheHomeWrapped } from '../interfaces/services/Cache';
import TitleModel from '../Models/Title';
import { E404, E503 } from './ErrorService';
import * as dto from '../handlers/dtos';
import { Logger } from './LoggerService';

class CacheService {
  readonly HomeWrapped: ICacheHomeWrapped = {
    featured: [],
    hightRated: [],
    popular: [],
    updatedRecently: []
  };

  constructor() {
    // Fill initial cache

    Promise.all([
      this.updateHomeWrapped()
    ]);
  }

  async updateHomeWrapped(): Promise<ICacheHomeWrapped> {
    const titles = await TitleModel.find();

    // Parse featured
    for (const key in config.STATIC.HomeWrapped.featured) {
      const { backgroundURL, id, videoURL } = config.STATIC.HomeWrapped.featured[key];

      const title = await TitleModel.findOne({ id: id });
      if (!title) throw new E404(`Title ${id} is not found in featured data`);

      this.HomeWrapped.featured.push({
        ...dto.title(title.toObject()),
        backgroundURL,
        videoURL
      });
    }

    // Parse popular
    this.HomeWrapped.popular = (await TitleModel.find({ id: { $in: config.STATIC.HomeWrapped.popular } })).map(el => dto.title(el.toObject()));

    // Fetch recently updated
    this.HomeWrapped.updatedRecently = titles.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20).map(el => dto.title(el.toObject()));

    // Fetch hight rated
    this.HomeWrapped.hightRated = titles.filter(el => el.rating.IMDB !== null).sort((a, b) => b.rating!.IMDB! - a.rating!.IMDB!).slice(0, 20).map(el => dto.title(el.toObject()));

    Logger.info(`[Cache]: Cache for Home Wrapped updated`);

    return this.HomeWrapped;
  }
}

export const Cache = new CacheService();
export default Cache;
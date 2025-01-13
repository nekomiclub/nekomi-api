import { ITitle } from '~/interfaces/Title';
import { Logger } from './LoggerService';
import { createUUID, getUTC } from '~/handlers/handler';



interface ICacheRecord {
  createdAt: number
  id: string
  data: any
}

export interface ICacheDubbedAnime {
  dubberId: string
  titles: ITitle[]
}



class CacheService {
  Cached: ICacheRecord[] = [];



  private checkCacheValidity(el: ICacheRecord): boolean {
    return el.createdAt + (60000 * 60) > getUTC().timestamp;
  }

  private getById<T>(id: string): T | undefined {
    const el = this.Cached.find(el => el.id === id);

    // Return cached
    if (el && this.checkCacheValidity(el)) return el.data;

    // Purge
    this.Cached = this.Cached.filter(record => record.id !== el?.id);
    return undefined;
  }

  /** Forced cache puge */
  forcePurge() {
    this.Cached.forEach(el => {
      if (!this.checkCacheValidity(el)) this.Cached = this.Cached.filter(record => record.id !== el?.id);
    });

    Logger.debug(`[CacheService]: Forced cache purge completed`);
  }

  push<T>(el: T) {
    this.Cached.push({
      id: createUUID(),
      createdAt: getUTC().timestamp,
      data: el,
    });
  }

  getDubbedAnime(id: string): ITitle[] | undefined {
    const existed = this.Cached.find(el => el.data?.dubberId === id);
    if (!existed) return undefined;

    const res = this.getById(existed.id) as ICacheDubbedAnime;
    return res.titles;
  }

}



const Cache = new CacheService();
export default Cache;
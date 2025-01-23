import { DevelopmentMode } from '~/config';
import { Logger } from './LoggerService';
import { getUTC } from '~/handlers/handler';



interface ICacheRecord<T = any> {
  id: string
  createdAt: number
  data: T
}



export class CacheService<T = any> {
  private Cached: ICacheRecord<T>[] = [];

  constructor() {
    // Purge every hour
    setInterval(() => {
      this.Cached = [];
    }, 3600000);
  }

  purge({ id }: { id: string }) {
    this.Cached = this.Cached.filter(el => el.id !== id);
  }

  get({ id }: { id: string }): T | undefined {
    const record = this.Cached.find(el => el.id === id);

    if (!record) return undefined;
    if (getUTC().timestamp > record.createdAt + (60000 * 60)) return undefined;

    return record.data;
  }

  push(payload: ICacheRecord<T>) {
    if (DevelopmentMode) return Logger.debug(`[CacheService (DEV)]: Cache push passed due to development mode`);

    this.purge({ id: payload.id });
    this.Cached.push(payload);
  }
}

export default CacheService;
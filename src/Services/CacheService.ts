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

  constructor(
    readonly name: string
  ) {
    // Purge every hour
    setInterval(() => {
      this.Cached = [];
      Logger.debug(`[CacheService:${this.name}]: Cache purged`);
    }, 3600000);
  }

  purge({ id }: { id: string }) {
    this.Cached = this.Cached.filter(el => el.id !== id);
    Logger.debug(`[CacheService:${this.name}]: Cache for ${id} purged`);
  }

  get({ id }: { id: string }): T | undefined {
    const record = this.Cached.find(el => el.id === id);

    if (!record) return undefined;

    if (getUTC().timestamp > record.createdAt + (60000 * 60)) {
      Logger.debug(`[CacheService:${this.name}]: Cache dropped due to it's expiration. [id: ${record.id}]`);
      return undefined;
    }

    Logger.debug(`[CacheService:${this.name}]: Cache used`);

    return record.data;
  }

  push(payload: ICacheRecord<T>) {
    if (DevelopmentMode) return Logger.debug(`[CacheService:${this.name} (DEV)]: Cache push passed due to development mode. [id: ${payload.id}]`);

    this.purge({ id: payload.id });
    this.Cached.push(payload);

    Logger.debug(`[CacheService:${this.name}]: Cache pushed. [id: ${payload.id}]`);
  }
}

export default CacheService;
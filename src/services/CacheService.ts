import Logger from './LoggerService';
import ms from 'ms';
import { DevelopmentMode } from '~/conf';
import { ISODateString } from '~/intf/types';
import { calcISO, getUTC } from '~/utils/utils';




interface ICacheServiceProps {
  /** Cache ttl. @default 1 hour */
  ttl?: number
}

interface ICacheRecord<T = any> {
  id: string
  createdAt: ISODateString
  data: T
}

type CacheAppendPayloadType = Omit<ICacheRecord<any>, 'createdAt'>



const CACHE_TTL_MS = ms('1hour');



export default class CacheService<T = any> {
  private cache: ICacheRecord<T>[] = [];
  props: Required<ICacheServiceProps>;



  constructor(
    readonly name: string,
    props?: ICacheServiceProps
  ) {
    this.props = {
      ttl: props?.ttl ?? CACHE_TTL_MS
    };
  }



  /**
   * Remove cache record
   */
  remove(id: string) {
    this._revalidate();

    this.cache = this.cache.filter(el => el.id !== id);

    Logger.debug(`[CacheService:${this.name}]: Cache for ${id} purged`);
  }



  /**
   * Get cache record
   */
  get(id: string): T | undefined {
    this._revalidate();

    const record = this.cache.find(el => el.id === id);
    if (!record) return;

    if (DevelopmentMode) Logger.debug(`[CacheService:${this.name} (DEV)]: Cache retrieved`);

    return record.data;
  }



  /**
   * Append cache record
   * Will remove cache with the same id
   */
  append({ id, data }: CacheAppendPayloadType) {
    this._revalidate();
    this.remove(id);

    this.cache.push({
      id: id,
      data: data,
      createdAt: getUTC().ISO
    });

    Logger.debug(`[CacheService:${this.name}]: Cache appended. [id: ${id}]`);
  }



  /**
   * Revalidate cache records
   */
  private _revalidate() {
    const cache: ICacheRecord<T>[] = [];

    this.cache.forEach(record => {
      if (calcISO(record.createdAt, this.props.ttl) > getUTC().timestamp) cache.push(record);
    });

    this.cache = cache;
  }
}
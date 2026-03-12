import Logger from './LoggerService';
import createId from '~/utils/create-id';
import { BrandedId, asBrandedId } from '~/intf/types';
import { DevelopmentMode } from '~/conf';
import { ISODateString } from '~/intf/types';
import { getUTC } from '~/utils/utils';



export type StackNodeId = BrandedId<string, 'stackNodeId'>



interface IStackNode<T> {
  id: StackNodeId
  created_at: ISODateString
  data: T
}



export default class StackServiceClass<T> {
  protected _stack: IStackNode<T>[] = [];
  protected busyId: string | undefined;



  constructor(
    readonly name: string,
    readonly job: (data: T) => Promise<void> | void
  ) {
    this.name = `[StackService/${this.name}]:`;
  }

  get stack() { return this._stack; }



  /** @returns id */
  append(data: T, props?: { doNotRun?: boolean }): string {
    const id = asStackNodeId(createId());

    this._stack.push({
      id,
      created_at: getUTC().ISO,
      data
    });

    if (!props?.doNotRun) this.run();

    return id;
  }



  remove(id: string) {
    this._stack = this._stack.filter(el => el.id !== id);
    this.run();

    if (DevelopmentMode) Logger.debug(`${this.name} Item "${id}" removed from the stack`);
  }



  dropAll() {
    this._stack = [];
  }



  async run() {
    if (this.busyId) return; // Skip cycle if job is running

    const item = this._stack[0];
    if (!item) return; // Skip if stack is empty

    try {
      this.busyId = item.id;

      await this.job(item.data);
    } catch (e) {
      Logger.error(`${this.name} Job run error`, e);
    } finally {
      this.busyId = undefined;

      this.remove(item.id);
      this.run();
    }
  }
}



const asStackNodeId = asBrandedId<StackNodeId>;
import { Collection, Db, MongoClient } from 'mongodb';
import z, { ZodObject } from 'zod';

import Logger from '~/services/LoggerService.js';
import env from '~/utils/env.js';



class MongoService {
  private _client: MongoClient | undefined;
  private _database: Db | undefined;



  constructor(uri = `mongodb+srv://${env('DATABASE_USR')}:${env('DATABASE_PWD')}@${env('DATABASE_HOST')}`, dbName = env('DATABASE_NAME')) {
    this._client = new MongoClient(uri, {
      retryWrites: true
    });

    this._database = this._client.db(dbName);
  }

  get database() {
    return this._database;
  }



  async connect() {
    await this._client?.connect();
    await this._client?.db('admin').command({ ping: 1 }); // Send a ping to confirm a successful connection

    Logger.debug(`[Runtime]: 🔗 MongoDB connection established`);
  }



  disconnect() {
    this._client?.close();
  }



  /** Create mongodb typed collection */
  collection<TSchema extends ZodObject>(name: string, schema: TSchema): Collection<z.infer<TSchema>> {
    if (!this._database) throw new Error('Client is not connected to the database');

    const collection = this._database.collection<z.infer<typeof schema>>(name);

    return collection;
  }
}



const Mongo = new MongoService();

export default Mongo;
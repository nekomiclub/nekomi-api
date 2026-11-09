import { Collection, Db, InsertOneOptions, MongoClient, OptionalUnlessRequiredId } from 'mongodb';
import z, { ZodObject } from 'zod';

import Logger from '~/services/LoggerService.js';
import env from '~/utils/env.js';



class MongoService {
  private _client: MongoClient | undefined;
  private _database: Db | undefined;



  get database() {
    return this._database;
  }



  async connect(uri = `mongodb+srv://${env('DATABASE_USR')}:${env('DATABASE_PWD')}@${env('DATABASE_HOST')}`, dbName = env('DATABASE_NAME')) {
    const client = new MongoClient(uri, {
      retryWrites: true
    });

    await client.connect();
    await client.db('admin').command({ ping: 1 }); // Send a ping to confirm a successful connection

    this._client = client;
    this._database = client.db(dbName);

    Logger.debug(`[Runtime]: 🔗 MongoDB connection established`);
  }



  disconnect() {
    this._client?.close();
  }



  /** Create mongodb typed collection */
  collection<TSchema extends ZodObject>(name: string, schema: TSchema): Collection<z.infer<TSchema>> {
    if (!this._database) throw new Error('Client is not connected to the database');

    const collection = this._database.collection<z.infer<typeof schema>>(name);

    return new Proxy(collection, {
      get(target, prop, receiver) {
        if (prop === 'insertOne') {
          return (document: OptionalUnlessRequiredId<z.input<TSchema>>, options?: InsertOneOptions) => {
            const parsed = schema.parse(document);

            return target.insertOne(parsed as OptionalUnlessRequiredId<z.output<TSchema>>, options);
          };
        }

        const value = Reflect.get(target, prop, receiver);

        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }
}



const Mongo = new MongoService();

export default Mongo;
import Logger from '~/services/LoggerService.js';
import env from '~/utils/env.js';
import z, { ZodObject } from 'zod';
import { Db, InsertOneOptions, MongoClient, OptionalUnlessRequiredId } from 'mongodb';



class MongoService {
  private database: Db | null = null;



  async connect() {
    const client = new MongoClient(`mongodb+srv://${env('DATABASE_USR')}:${env('DATABASE_PWD')}@${env('DATABASE_HOST')}`, {
      retryWrites: true
    });

    await client.connect();
    await client.db('admin').command({ ping: 1 }); // Send a ping to confirm a successful connection

    this.database = client.db(env('DATABASE_NAME'));
    // this.database = client.db('testing');

    Logger.debug(`[Runtime]: 🔗 MongoDB connection established`);
  }



  /** Create mongodb typed collection */
  model<TSchema extends ZodObject>(name: string, schema: TSchema) {
    if (!this.database) throw new Error('Client is not connected to the database');

    const collection = this.database.collection<z.infer<typeof schema>>(name);

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
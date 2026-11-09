import { type Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | undefined;
let client: MongoClient | undefined;
let db: Db | undefined;



/** Start the in-memory server once per test file */
export async function startMongo(): Promise<Db> {
  if (db) return db;

  mongod = await MongoMemoryServer.create();
  client = await MongoClient.connect(mongod.getUri());
  db = client.db('test');

  return db;
}



export function getDb(): Db {
  if (!db) throw new Error('startMongo() has not been called yet');
  return db;
}



/** Empty every collection (cheaper than restarting the server) */
export async function clearDb() {
  const collections = await getDb().collections();
  await Promise.all(collections.map(c => c.deleteMany({})));
}



export async function stopMongo() {
  await client?.close();
  await mongod?.stop();
  mongod = client = db = undefined;
}



/** Drop-in replacement for the default export of MongoDB.service */
export async function createMongoServiceMock() {
  const database = await startMongo();

  return {
    default: {
      collection: (name: string) => database.collection(name),
    },
  };
}
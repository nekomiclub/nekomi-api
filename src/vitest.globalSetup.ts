import conf from './conf.js';
import mongoose, { Schema } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';



const UserModel = mongoose.model('user', new Schema({
  id: String,
  username: String,
  email: String,
}, { strict: false, versionKey: false }));

const AnimeModel = mongoose.model('anime', new Schema({
  id: String,
  slug: String,
}, { strict: false, versionKey: false }));

const TeamModel = mongoose.model('team', new Schema({
  id: String,
  slug: String,
}, { strict: false, versionKey: false }));



let mongod: MongoMemoryServer;



export async function setup() {

}



export async function teardown() {
  mongoose.set('strictQuery', false);

  await mongoose.connect(conf.mongodb_uri, {
    retryWrites: true,
  });



  const usersDeletedData = await UserModel.deleteMany({
    $or: [
      { id: { $regex: /testing/gi } },
      { email: { $regex: /testing/gi } },
      { username: { $regex: /testing/gi } },
    ]
  });

  const animeDeletedData = await AnimeModel.deleteMany({
    $or: [
      { id: { $regex: /testing/gi } },
      { slug: { $regex: /testing/gi } },
    ]
  });

  const teamDeletedData = await TeamModel.deleteMany({
    $or: [
      { id: { $regex: /testing/gi } },
      { slug: { $regex: /testing/gi } },
    ]
  });



  console.log(`[VitestTeardown]: Testing entities (${usersDeletedData.deletedCount + animeDeletedData.deletedCount + teamDeletedData.deletedCount}) removed`);
}
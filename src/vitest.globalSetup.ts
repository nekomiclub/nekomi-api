import mongoose, { Schema } from 'mongoose';

import conf from './conf.js';



const UserModel = mongoose.model('user', new Schema({
  id: String,
  username: String,
  email: String,
}, { strict: false, versionKey: false }));

const AnimeModel = mongoose.model('anime', new Schema({
  id: String,
  slug: String,
}, { strict: false, versionKey: false }));



export async function setup() {

}



export async function teardown() {
  mongoose.set('strictQuery', false);
  await mongoose.connect(conf.mongodb_uri, { retryWrites: true });

  try {
    const [users, anime] = await Promise.all([
      UserModel.deleteMany({
        $or: [
          { id: { $regex: /^testing/i } },
          { email: { $regex: /^testing/i } },
          { username: { $regex: /^testing/i } },
        ],
      }),
      AnimeModel.deleteMany({
        $or: [{ id: { $regex: /^testing/i } }, { slug: { $regex: /^testing/i } }],
      })
    ]);

    console.log(
      `[VitestTeardown]: Testing entities (${users.deletedCount + anime.deletedCount}) removed`
    );
  } finally {
    await mongoose.disconnect();
  }
}
import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import * as router from './router';

const app = express();

app.use(express.json());
app.use('/v1', router.ApiV1);

if (!process.env.PORT) {
  throw new Error('PORT ENV IS NOT DEFINED');
}

app.listen(+process.env.PORT, String(process.env.IP), () => {
  console.log(`Server is listening on ${process.env.IP}:${process.env.PORT} ...`);
});
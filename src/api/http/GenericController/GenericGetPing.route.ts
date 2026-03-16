import conf from '~/conf';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';



const ResponseSchema = z.object({
  message: z.string(),
  startedAt: z.string()
});



/**
 * Ping API
 */
const endpoint = HandleRequest(async (req, res) => {
  return res.status(200).json({
    message: 'pong!',
    startedAt: conf.startedAt
  } satisfies z.infer<typeof ResponseSchema>);
});



export default [
  endpoint
];
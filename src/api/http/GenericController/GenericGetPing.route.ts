import conf from '~/conf';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';



export const GetPingResponseSchema = z.object({
  message: z.string(),
  started_at: z.string()
});



/**
 * Ping API
 */
const endpoint = HandleRequest(async (req, res) => {
  return res.status(200).json({
    message: 'pong!',
    started_at: conf.startedAt
  } satisfies z.infer<typeof GetPingResponseSchema>);
});



export default [
  endpoint
];
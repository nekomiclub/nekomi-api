import CSRFService from '~/service/CSRFService';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';



interface IResponse {
  message: string
  verified: boolean
  origin?: string | null
}



const BodySchema = z.object({
  token: z.string().nonempty(),

  /** Required origin */
  origin: z.string().optional(),
});



/**
 * Verify CSRF
 */
const endpoint = HandleRequest(async (req, res) => {
  const { token, origin } = BodySchema.parse(req.body);

  const { verified, origin: tokenOrigin } = await CSRFService.verify(token, origin);



  return res.status(200).json({
    message: 'Token accepted',
    verified,
    origin: tokenOrigin
  } satisfies IResponse);
});



const GenericGetCSRFRoute = [
  endpoint
];

export default GenericGetCSRFRoute;
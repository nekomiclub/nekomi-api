import CSRFService from '~/service/CSRFService';
import z from 'zod';
import { HTTPEndpoint } from '~/service/HTTPService';



interface IResponse {
  message: string
  verified: boolean
  origin?: string | null
}



const BodySchema = z.object({
  token: z.string(),

  /** Required origin */
  origin: z.string().optional(),
});



/**
 * Verify CSRF
 */
const endpoint = HTTPEndpoint(async (req, res) => {
  const { token, origin } = BodySchema.parse(req.body);

  const { verified, origin: tokenOrigin } = await CSRFService.verify(token, origin);



  return res.status(200).json({
    message: 'Token accepted',
    verified,
    origin: tokenOrigin
  } as IResponse);
});



const GenericGetCSRFRoute = [
  endpoint
];

export default GenericGetCSRFRoute;
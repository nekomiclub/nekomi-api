import CSRFService from '~/service/CSRFService';
import z from 'zod';
import { HTTPEndpoint } from '~/service/HTTPService';



const BodySchema = z.object({
  token: z.string(),
  requestedOrigin: z.string().optional()
});



/**
 * Verify CSRF
 */
const endpoint = HTTPEndpoint(async (req, res) => {
  const { token, requestedOrigin } = BodySchema.parse(req.body);

  const verified = await CSRFService.verify(token, requestedOrigin);

  return res.status(200).json({
    message: 'Token validated',
    verified
  });
});



const GenericGetCSRF = [
  endpoint
];

export default GenericGetCSRF;
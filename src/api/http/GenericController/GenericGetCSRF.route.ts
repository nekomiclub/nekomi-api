import CSRFService from '~/service/CSRFService';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';



const BodySchema = z.object({
  token: z.string().nonempty(),

  /** Required origin */
  origin: z.string().optional(),
});

const ResponseSchema = z.object({
  message: z.string(),
  verified: z.boolean(),
  origin: z.string().nullable().optional(),
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
  } satisfies z.infer<typeof ResponseSchema>);
});



const GenericGetCSRFRoute = [
  endpoint
];

export default GenericGetCSRFRoute;
import { HTTPEndpoint } from '~/service/HTTPService';



/**
 * Get document
 */
const endpoint = HTTPEndpoint(async (req, res) => {
  return res.status(200).json({ message: 'ok' });
});



const AnimeGetDocumentRoute = [
  endpoint
];

export default AnimeGetDocumentRoute;
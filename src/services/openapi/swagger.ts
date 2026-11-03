import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';

import { generateOpenAPI } from './generate';



const router = Router();
const openapi = generateOpenAPI();



router.get('/openapi.json', (req, res) => {
  res.json(openapi);
});

router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(openapi),
);



export default router;
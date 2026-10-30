import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';

import { registry } from './registry';



export function generateOpenAPI() {
  const generator = new OpenApiGeneratorV31(
    registry.definitions,
  );

  return generator.generateDocument({
    openapi: '3.1.0',

    info: {
      title: 'nekomi-api',
      version: '0.0.0',
      description: 'nekomi api server openapi',
    },

    servers: [
      {
        url: '/',
        description: 'Main gateway',
      },
    ],
  });
}
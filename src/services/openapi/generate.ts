import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';

import conf from 'src/conf.js';
import { registry } from './registry.js';



export function generateOpenAPI() {
  const generator = new OpenApiGeneratorV31(
    registry.definitions,
  );

  return generator.generateDocument({
    openapi: '3.1.0',

    info: {
      title: 'nekomi-api',
      version: conf.env.APP_VERSION ? `v${conf.env.APP_VERSION}` : 'v0.0.0',
      description: 'Express API ⚙️',
      termsOfService: 'https://nekomi.club/legal/terms-of-service',
      license: {
        name: 'Licensed under GNU AGPL 3.0',
        url: 'https://github.com/nekomiclub/nekomi-api/blob/main/LICENSE'
      }
    },
  });
}
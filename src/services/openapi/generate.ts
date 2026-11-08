import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';

import env from '~/utils/env.js';
import { registry } from './registry.js';



export function generateOpenAPI() {
  const generator = new OpenApiGeneratorV31(
    registry.definitions,
  );

  return generator.generateDocument({
    openapi: '3.1.0',

    info: {
      title: 'nekomi-api',
      version: env('APP_VERSION') ? `v${env('APP_VERSION')}` : 'v0.0.0',
      description: 'Express API ⚙️',
      termsOfService: 'https://nekomi.club/legal/terms-of-service',
      license: {
        name: 'Licensed under GNU AGPL 3.0',
        url: 'https://github.com/nekomiclub/nekomi-api/blob/main/LICENSE'
      }
    },
  });
}
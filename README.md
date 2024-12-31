# NEKOMI API
nekomi-api is an nekomi.club backend. Provides title, dubber & user APIs.
**HTTP port in development mode will be changed from ANIMEE_CONFIG to 80**
Any production runs will be rejected if IP does not match config ```vars.prodIP```

## Docs
- [Endpoints](./docs/endpoints.md)
- [Features](./docs/features.md)
- [Roles](./docs/roles.md)
- [Secrets](./docs/secrets.md)
- [Services](./docs/services.md)

## Dependencies
- nekomi-uploads (PATCH /title)
- fk-usapi
- fk-authority
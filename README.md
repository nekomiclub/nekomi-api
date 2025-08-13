# NEKOMI API
nekomi-api is an nekomi.club backend. Simple, isn't it?

> [!IMPORTANT]
> In DevelopmentMode env.PORT will be changed into 80

## Setup Guide
1. Add .env file (see .env.example)
2. ```npm ci```
3. ```npm run start```

## Docker
Make image of this repo
```bash
docker build -t nekomi-api .
```

Run container 
```bash
docker run -p 43080:43080 --rm --name nekomi-api-service -d nekomi-api -v ~/nekomi/nekomi-api/logs:/logs
```

## Docs
- [Roles](./docs/roles.md)
- [Secrets](./docs/secrets.md)
- [Services](./docs/services.md)
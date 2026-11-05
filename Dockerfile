ARG NODE_VERSION=24

# ---- Base: Node + pnpm via corepack ----
FROM node:${NODE_VERSION}-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app



# ---- Dependencies (all, for building) ----
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile



# ---- Build: compile TypeScript ----
FROM deps AS build

COPY tsconfig.json ./
COPY src ./src

RUN pnpm run build



# ---- Production dependencies only ----
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --prod



# ---- Runtime ----
FROM node:${NODE_VERSION}-alpine AS runtime

ARG GIT_SHA=unknown
ARG APP_VERSION=v0.0.0
ENV GIT_SHA=$GIT_SHA \
  APP_VERSION=$APP_VERSION

ENV DOCKER=true

WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json errors_list.json ./

USER node
EXPOSE 80

CMD ["node", "dist/index.js"]
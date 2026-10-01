# ===============================
# Base (Corepack + PNPM)
# ===============================
FROM node:22.18.0-slim AS base
ENV NODE_ENV=production \
    PNPM_HOME=/pnpm \
    PNPM_STORE_DIR=/pnpm-store \
    PATH=/pnpm:$PATH
WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@latest --activate \
    && mkdir -p /pnpm /pnpm-store

# ===============================
# deps (pnpm fetch)
# ===============================
FROM base AS deps
ENV NODE_ENV=development
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm fetch

# ===============================
# build: dev deps + build
# ===============================
FROM base AS build
ENV NODE_ENV=development
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /pnpm-store /pnpm-store
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# ===============================
# prod: prune dev deps
# ===============================
FROM build AS prod
ENV NODE_ENV=production

RUN HUSKY=0 npm_config_ignore_scripts=true \
    pnpm prune --prod --ignore-scripts --reporter=silent

# ===============================
# runner
# ===============================
FROM node:22.18.0-slim AS runner
ENV NODE_ENV=production \
    PNPM_HOME=/pnpm \
    PNPM_STORE_DIR=/pnpm-store \
    PATH=/pnpm:$PATH

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@latest --activate \
    && apt-get update \
    && apt-get install -y --no-install-recommends openssl procps \
    && npm install -g pm2@latest \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /pnpm /pnpm-store /app/logger \
    && chown -R node:node /app

COPY --chown=node:node --from=prod /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node ecosystem.config.js ./
COPY --chown=node:node .env.example ./.env.example

EXPOSE 5000
USER node
CMD ["node", "dist/server.js"]
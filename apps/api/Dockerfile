# ---- base ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- deps (dev + build) ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY scripts/prepare-husky.mjs scripts/prepare-husky.mjs
RUN npm ci -w @cv/api

# ---- deps (production-only) ----
FROM base AS prod-deps
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY scripts/prepare-husky.mjs scripts/prepare-husky.mjs
RUN npm ci -w @cv/api --omit=dev

# ---- dev ----
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/api/node_modules /app/apps/api/node_modules
COPY apps/api /app/apps/api
COPY package.json /app/package.json
WORKDIR /app
EXPOSE 3000
CMD ["npm", "run", "start:dev", "-w", "@cv/api"]

# ---- build ----
FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/api/node_modules /app/apps/api/node_modules
COPY apps/api /app/apps/api
COPY package.json /app/package.json
WORKDIR /app/apps/api
RUN npm run build

# ---- prod ----
FROM node:20-alpine AS prod
WORKDIR /app/apps/api
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY apps/api/package.json /app/apps/api/package.json
RUN rm -rf \
  /usr/local/lib/node_modules/npm \
  /usr/lib/node_modules/npm \
  /usr/local/bin/npm \
  /usr/local/bin/npx \
  /usr/bin/npm \
  /usr/bin/npx
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]

# ---- base ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- deps (dev + build) ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci

# ---- deps (production-only) ----
FROM base AS prod-deps
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --omit=dev

# ---- dev ----
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules /app/node_modules
COPY apps/api /app/apps/api
COPY package.json /app/package.json
WORKDIR /app
EXPOSE 3000
CMD ["npm", "run", "start:dev", "-w", "@cv/api"]

# ---- build ----
FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY apps/api /app/apps/api
COPY package.json /app/package.json
WORKDIR /app
RUN npm run build -w @cv/api

# ---- prod ----
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/dist /app/dist
COPY apps/api/package.json /app/package.json
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]

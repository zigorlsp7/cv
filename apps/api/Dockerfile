# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json

# Install only what the api workspace needs
RUN npm ci

# ---- dev ----
FROM node:20-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development

COPY --from=deps /app/node_modules /app/node_modules
COPY apps/api /app/apps/api
COPY package.json /app/package.json

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["npm","run","start:dev"]

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules /app/node_modules
COPY apps/api /app/apps/api
COPY package.json /app/package.json

WORKDIR /app/apps/api
RUN npm run build

# ---- prod ----
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/apps/api/dist /app/dist
COPY --from=deps /app/node_modules /app/node_modules
COPY apps/api/package.json /app/package.json

EXPOSE 3000
CMD ["node","dist/main.js"]
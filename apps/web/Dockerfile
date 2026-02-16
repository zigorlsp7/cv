# ---- base ----
FROM node:20-alpine AS base
WORKDIR /workspace

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY scripts/prepare-husky.mjs scripts/prepare-husky.mjs
RUN npm ci -w web

# ---- dev ----
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /workspace/node_modules /workspace/node_modules
COPY --from=deps /workspace/apps/web/node_modules /workspace/apps/web/node_modules
COPY apps/web apps/web
WORKDIR /workspace
EXPOSE 3001
CMD ["npm", "run", "dev", "-w", "web", "--", "-p", "3001", "-H", "0.0.0.0"]

# ---- build ----
FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /workspace/node_modules /workspace/node_modules
COPY --from=deps /workspace/apps/web/node_modules /workspace/apps/web/node_modules
COPY package.json /workspace/package.json
COPY apps/web /workspace/apps/web
WORKDIR /workspace/apps/web
RUN npm run build

# ---- prod ----
FROM node:20-alpine AS prod
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
COPY --from=build /workspace/apps/web/.next/standalone ./
COPY --from=build /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /workspace/apps/web/public ./apps/web/public
RUN rm -rf \
  /usr/local/lib/node_modules/npm \
  /usr/lib/node_modules/npm \
  /usr/local/bin/npm \
  /usr/local/bin/npx \
  /usr/bin/npm \
  /usr/bin/npx
USER node
EXPOSE 3001
CMD ["node", "server.js"]

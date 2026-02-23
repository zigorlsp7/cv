# ---- base ----
FROM node:25-alpine AS base
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
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_RUM_ENABLED
ARG NEXT_PUBLIC_RUM_ENDPOINT
ARG NEXT_PUBLIC_RELEASE
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_RUM_ENABLED=${NEXT_PUBLIC_RUM_ENABLED}
ENV NEXT_PUBLIC_RUM_ENDPOINT=${NEXT_PUBLIC_RUM_ENDPOINT}
ENV NEXT_PUBLIC_RELEASE=${NEXT_PUBLIC_RELEASE}
COPY --from=deps /workspace/node_modules /workspace/node_modules
COPY --from=deps /workspace/apps/web/node_modules /workspace/apps/web/node_modules
COPY package.json /workspace/package.json
COPY apps/web /workspace/apps/web
WORKDIR /workspace/apps/web
RUN npm run build

# ---- prod ----
FROM node:25-alpine AS prod
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
COPY --from=build /workspace/apps/web/.next/standalone ./
COPY --from=build /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /workspace/apps/web/public ./apps/web/public
COPY scripts/openbao-run.mjs /app/scripts/openbao-run.mjs
RUN rm -rf \
  /usr/local/lib/node_modules/npm \
  /usr/lib/node_modules/npm \
  /usr/local/bin/npm \
  /usr/local/bin/npx \
  /usr/bin/npm \
  /usr/bin/npx
USER node
EXPOSE 3001
CMD ["node", "apps/web/server.js"]

# ---- local (prod runtime + OpenBao runtime helper) ----
FROM prod AS local

# ---- base ----
FROM node:25-alpine AS base
WORKDIR /workspace

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/ui/package.json apps/ui/package.json
COPY scripts/prepare-husky.mjs scripts/prepare-husky.mjs
RUN npm ci -w web

# ---- dev ----
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /workspace/node_modules /workspace/node_modules
COPY --from=deps /workspace/apps/ui/node_modules /workspace/apps/ui/node_modules
COPY apps/ui apps/ui
WORKDIR /workspace
EXPOSE 3001
CMD ["npm", "run", "dev", "-w", "web", "--", "-p", "3001", "-H", "0.0.0.0"]

# ---- build ----
FROM base AS build
ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_RUM_ENABLED
ARG NEXT_PUBLIC_RELEASE
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_RUM_ENABLED=${NEXT_PUBLIC_RUM_ENABLED}
ENV NEXT_PUBLIC_RELEASE=${NEXT_PUBLIC_RELEASE}
COPY --from=deps /workspace/node_modules /workspace/node_modules
COPY --from=deps /workspace/apps/ui/node_modules /workspace/apps/ui/node_modules
COPY package.json /workspace/package.json
COPY apps/ui /workspace/apps/ui
WORKDIR /workspace/apps/ui
RUN npm run build

# ---- prod ----
FROM node:25-alpine AS prod
WORKDIR /app/apps/ui
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
RUN apk upgrade --no-cache zlib
COPY --from=build /workspace/apps/ui/.next/standalone ./
COPY --from=build /workspace/apps/ui/.next/static ./apps/ui/.next/static
COPY --from=build /workspace/apps/ui/public ./apps/ui/public
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
CMD ["node", "apps/ui/server.js"]

# ---- local (prod runtime + OpenBao runtime helper) ----
FROM prod AS local

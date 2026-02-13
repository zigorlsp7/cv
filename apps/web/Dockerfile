# ---- base ----
FROM node:20-alpine AS base
WORKDIR /workspace

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci

# ---- dev ----
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /workspace/node_modules /workspace/node_modules
COPY apps/web apps/web
WORKDIR /workspace
EXPOSE 3001
CMD ["npm", "run", "dev", "-w", "web", "--", "-p", "3001", "-H", "0.0.0.0"]

# ---- build ----
FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /workspace/node_modules /workspace/node_modules
COPY package.json /workspace/package.json
COPY apps/web /workspace/apps/web
WORKDIR /workspace
RUN npm run build -w web

# ---- prod ----
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
COPY --from=build /workspace/apps/web/.next/standalone ./
COPY --from=build /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /workspace/apps/web/public ./apps/web/public
USER node
EXPOSE 3001
CMD ["node", "apps/web/server.js"]

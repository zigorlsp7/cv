FROM node:20-alpine AS dev
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/web apps/web
WORKDIR /workspace/apps/web

EXPOSE 3001
CMD ["npm","run","dev","--","-p","3001","-H","0.0.0.0"]
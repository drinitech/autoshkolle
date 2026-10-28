# syntax=docker/dockerfile:1
FROM node:22-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Dev mode (docker-compose.dev.yml bind-mounts src/). Polling (-L) because file events
# from Windows bind mounts don't reach the container.
FROM deps AS dev
RUN npm install -g nodemon@3
ENV PATH=/app/node_modules/.bin:$PATH
COPY . .
RUN npx prisma generate
CMD ["nodemon", "-L", "--watch", "src", "--ext", "ts,json", "--exec", "tsx src/index.ts"]

FROM deps AS build
COPY . .
RUN npx prisma generate && npx tsc -p tsconfig.json && npm prune --omit=dev

FROM base
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
EXPOSE 4000
CMD ["node", "dist/index.js"]

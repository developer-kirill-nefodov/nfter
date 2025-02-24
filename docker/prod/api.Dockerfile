# Build stage: full toolchain, dev dependencies, TypeScript compiler.
FROM node:22-bookworm-slim AS build

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY app/backend/package.json app/backend/package-lock.json ./
RUN npm ci

COPY app/backend/src ./src
COPY app/backend/tsconfig.json ./
RUN npm run build && npm prune --omit=dev

# Runtime stage: no compiler, no sources, no dev dependencies.
FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production

WORKDIR /home/nodejs/api

COPY --from=build /build/node_modules ./node_modules
COPY --from=build /build/dist ./dist
COPY app/backend/package.json ./
COPY app/backend/src/migrations ./src/migrations
COPY app/backend/.sequelizerc ./

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
  CMD node -e "require('http').get('http://localhost:3001/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]

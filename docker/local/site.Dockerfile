FROM node:22-bookworm-slim

WORKDIR /app

COPY app/frontend/package.json app/frontend/package-lock.json ./

RUN npm ci

COPY app/frontend/src ./src
COPY app/frontend/public ./public
COPY app/frontend/index.html app/frontend/vite.config.ts app/frontend/tsconfig.json ./

# npm ci runs as root, so node_modules ends up root-owned — and Vite, running as
# `node`, then cannot create its node_modules/.vite pre-bundle cache. It fails
# with EACCES and serves 504s for every dependency.
RUN chown -R node:node /app

USER node

EXPOSE 3000

# --host is what makes Vite listen on 0.0.0.0 rather than only inside the container.
CMD ["npm", "run", "start"]

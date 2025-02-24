FROM node:22-bookworm-slim

WORKDIR /app

COPY app/frontend/package.json app/frontend/package-lock.json ./

RUN npm ci

COPY app/frontend/src ./src
COPY app/frontend/public ./public
COPY app/frontend/index.html app/frontend/vite.config.ts app/frontend/tsconfig.json ./

USER node

EXPOSE 3000

# --host is what makes Vite listen on 0.0.0.0 instead of only inside the container.
CMD ["npm", "run", "start"]

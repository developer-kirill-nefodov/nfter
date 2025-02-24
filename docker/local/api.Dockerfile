FROM node:22-bookworm-slim

# argon2 ships prebuilt binaries for most platforms but falls back to building
# from source; python3 and a toolchain are what make that fallback succeed.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /home/nodejs/api

COPY app/backend/package.json app/backend/package-lock.json ./

RUN npm ci

COPY app/backend/src ./src
COPY app/backend/tsconfig.json app/backend/.sequelizerc ./

USER node

EXPOSE 3001

CMD ["npm", "run", "dev"]

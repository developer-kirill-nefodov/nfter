FROM node:22-bookworm-slim AS build

WORKDIR /build

COPY app/frontend/package.json app/frontend/package-lock.json ./
RUN npm ci

COPY app/frontend ./

# Vite inlines VITE_* variables at build time, so they are arguments to the
# build — not runtime configuration.
ARG VITE_API_URL
ARG VITE_CHAIN_ID
ARG VITE_CHAIN_NAME

RUN npm run build

# The result is static files; nginx serves them and nothing else runs.
FROM nginx:1.27-alpine AS runtime

COPY --from=build /build/build /usr/share/nginx/html
COPY docker/nginx/spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

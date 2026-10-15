# syntax=docker/dockerfile:1
FROM node:24-bookworm AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund
COPY . .

# EmDash serializes these paths and the HTTPS origin into its build output.
# They must match the runtime container, independently of the host filesystem.
ARG SITE_URL=https://affiliate.restupambudi.my.id
ENV SITE_URL=${SITE_URL} \
    EMDASH_SITE_URL=${SITE_URL} \
    EMDASH_DATABASE_URL=file:/app/data/desk-edit.db \
    EMDASH_UPLOADS_DIR=/app/data/uploads \
    CMS_ADMIN_ENABLED=false \
    STAGING_PREVIEW=false
RUN mkdir -p /app/data/uploads \
    && npm run build \
    && npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321 \
    EMDASH_DATABASE_URL=file:/app/data/desk-edit.db \
    EMDASH_UPLOADS_DIR=/app/data/uploads \
    CMS_ADMIN_ENABLED=false \
    STAGING_PREVIEW=false

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/seed ./seed

# Astro's Node adapter defaults to /app/node_modules/.astro/sessions.
# Redirect that directory into the same persistent volume as SQLite/uploads.
RUN mkdir -p /app/data/uploads /app/data/sessions /app/node_modules/.astro \
    && ln -s /app/data/sessions /app/node_modules/.astro/sessions \
    && chown -R node:node /app/data /app/node_modules/.astro
USER node
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]

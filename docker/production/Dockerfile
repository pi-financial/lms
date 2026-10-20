# syntax=docker/dockerfile:1.7
#
# REDUNDANT — no workflow builds this; production-promote.yaml retags the staging image.
# Identical to docker/staging/Dockerfile below this header.
#
# glibc throughout to match the distroless runtime: node_modules built against Alpine's musl fail
# there as soon as a dependency ships a native binding.
FROM node:24-bookworm-slim AS base

FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json yarn.lock ./
COPY scripts/copy-fonts.mjs ./scripts/copy-fonts.mjs

RUN --mount=type=secret,id=GIT_AUTH_TOKEN \
    echo "@pi-financial:registry=https://npm.pkg.github.com" >> ~/.npmrc && \
    echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/GIT_AUTH_TOKEN)" >> ~/.npmrc && \
    git config --global url."https://x-access-token:$(cat /run/secrets/GIT_AUTH_TOKEN)@github.com/".insteadOf "ssh://git@github.com/" && \
    git config --global --add url."https://x-access-token:$(cat /run/secrets/GIT_AUTH_TOKEN)@github.com/".insteadOf "git@github.com:" && \
    yarn install --frozen-lockfile && \
    rm -f ~/.npmrc ~/.gitconfig

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# public/fonts is gitignored and derived, so `COPY . .` above cannot carry it.
RUN node scripts/copy-fonts.mjs

RUN yarn build

# Next copies .env* into the standalone output. Shipping it would give every key an in-image
# fallback the platform cannot override, and leak the placeholder as a real server-side value.
RUN rm -f .next/standalone/.env*

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/docker/entrypoint.mjs ./entrypoint.mjs
# Distroless nonroot cannot mkdir at runtime.
RUN mkdir -p .next/cache

FROM gcr.io/distroless/nodejs24-debian12:nonroot
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=runner --chown=65532:65532 /app ./

USER nonroot
EXPOSE 3000

# The distroless entrypoint is node, so this runs `node entrypoint.mjs`. It rewrites /app/.next in
# place, so readOnlyRootFilesystem is incompatible — the container exits on EROFS at startup.
CMD ["entrypoint.mjs"]

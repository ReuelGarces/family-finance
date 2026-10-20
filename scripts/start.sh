#!/bin/sh
set -eu

# Prefer the Compose connection string when Coolify injects a stale managed DATABASE_URL.
if [ -n "${COMPOSE_DATABASE_URL:-}" ]; then
  export DATABASE_URL="${COMPOSE_DATABASE_URL}"
fi

./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/tsx prisma/seed.ts
exec node server.js

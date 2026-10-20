#!/bin/sh
set -eu

# Prefer the Compose URL when Coolify injects a stale managed DATABASE_URL.
# Prisma requires special characters in URL credentials to be percent-encoded.
if [ -n "${COMPOSE_DATABASE_URL:-}" ]; then
  export DATABASE_URL="$(
    COMPOSE_DATABASE_URL="$COMPOSE_DATABASE_URL" node -e '
      const url = new URL(process.env.COMPOSE_DATABASE_URL);

      const encodeComponent = (value) => {
        let decoded;
        try {
          decoded = decodeURIComponent(value);
        } catch {
          decoded = value;
        }
        return encodeURIComponent(decoded).replace(/[!\x27()*]/g, (character) =>
          `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
        );
      };

      url.username = encodeComponent(url.username);
      url.password = encodeComponent(url.password);
      process.stdout.write(url.toString());
    '
  )"
fi

./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/tsx prisma/seed.ts
exec node server.js

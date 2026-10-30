#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-$HOME/client-huntr-id}"
ENV_FILE="${ENV_FILE:-.env.production}"

cd "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Create it from the production environment values before deployment." >&2
  exit 1
fi

git pull --ff-only origin master
docker compose --env-file "$ENV_FILE" -f docker-compose.production.yml up -d --build --remove-orphans

echo "Huntr frontend is listening through Nginx on port 5173."

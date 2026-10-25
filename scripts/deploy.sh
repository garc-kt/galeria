#!/usr/bin/env bash
set -eo pipefail

APP_DIR=/srv/galeria/current
ENV_FILE=/srv/galeria/.env
SERVICE=galeria
SITE_HOST=example.com

if [ -f "$APP_DIR/.env.local" ]; then
  echo "Remova $APP_DIR/.env.local do servidor; use $ENV_FILE."
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [ -z "$SITE_HOST" ] || [ "$SITE_HOST" = "example.com" ]; then
  SITE_HOST=$(printf '%s' "$NEXT_PUBLIC_SITE_URL" | sed -e 's|^https\?://||' -e 's|/.*$||')
fi

cd "$APP_DIR"

echo "==> Install dependencies"
pnpm install --frozen-lockfile

echo "==> Build"
pnpm build

echo "==> Migrate database"
pnpm db:migrate

echo "==> Restart service"
sudo systemctl restart "$SERVICE"
sudo systemctl --no-pager --lines=20 status "$SERVICE"

echo "==> Health check"
sleep 2
curl -fsS "https://$SITE_HOST/api/health"
echo
echo "Deploy concluído."

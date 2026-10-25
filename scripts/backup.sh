#!/usr/bin/env bash
set -eo pipefail
umask 077

ENV_FILE=/srv/galeria/.env
BACKUP_DIR=/srv/galeria/backups
KEEP_DAYS=30

set -a
source "$ENV_FILE"
set +a

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

echo "==> pg_dump"
pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip -9 > "$BACKUP_DIR/db-$STAMP.sql.gz"
chmod 600 "$BACKUP_DIR/db-$STAMP.sql.gz"

echo "==> Off-site copy (restic)"
if command -v restic >/dev/null 2>&1 && [ -n "$RESTIC_REPOSITORY" ]; then
  restic backup \
    "$BACKUP_DIR/db-$STAMP.sql.gz" \
    /srv/galeria/current/storage/originals \
    /srv/galeria/current/storage/masters \
    --tag galeria
  restic forget --keep-daily 14 --keep-weekly 8 --keep-monthly 6 --prune
else
  echo "restic não configurado; cópia local apenas."
fi

echo "==> Prune local dumps"
find "$BACKUP_DIR" -name 'db-*.sql.gz' -mtime +$KEEP_DAYS -delete

echo "Backup concluído: $BACKUP_DIR/db-$STAMP.sql.gz"

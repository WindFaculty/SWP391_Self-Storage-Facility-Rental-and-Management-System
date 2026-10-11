#!/usr/bin/env bash
# MySQL backup for the dockerised database (W9: backup + restore rehearsal).
#
# Usage:
#   MYSQL_CONTAINER=storage-mysql DB_NAME=storage_staging BACKUP_DIR=/var/backups/mysql ./backup-mysql.sh
#
# Restore rehearsal (on a scratch host):
#   gunzip -c <file>.sql.gz | docker exec -i "$MYSQL_CONTAINER" mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME"
set -euo pipefail

MYSQL_CONTAINER="${MYSQL_CONTAINER:-storage-mysql}"
DB_NAME="${DB_NAME:?set DB_NAME}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$BACKUP_DIR/${DB_NAME}_${STAMP}.sql.gz"

docker exec "$MYSQL_CONTAINER" sh -c \
  'exec mysqldump --single-transaction --routines --triggers -uroot -p"$MYSQL_ROOT_PASSWORD" "$0"' \
  "$DB_NAME" | gzip > "$FILE"

find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "backup written: $FILE"

#!/usr/bin/env bash
set -Eeuo pipefail

log() { echo -e "\n\033[1;32m*$1*\033[0m"; }

APP_DIR="$HOME/apps/doctor-tracker-server"
OWNER="sampod76"
IMAGE="ghcr.io/$OWNER/doctor-tracker-server:latest"

cd "$APP_DIR"

log "Pulling latest image"
docker pull "$IMAGE"

log "Restarting backend container"
docker compose --profile app up -d --force-recreate app

log "Cleaning unused images"
docker image prune -f
docker builder prune -f
# docker container prune -f

log "Backend deployed successfully"

exit 0
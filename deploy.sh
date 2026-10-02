#!/usr/bin/env bash
set -Eeuo pipefail

log() {
  echo -e "\n\033[1;32m**$1**\033[0m"
}

APP_DIR="$HOME/apps/doctor-tracking-dashboard"
COMPOSE_FILE="docker-compose.pro.yml"

cd "$APP_DIR"

log "Pulling latest backend image"
docker compose -f "$COMPOSE_FILE" pull app

log "Restarting backend container"
docker compose -f "$COMPOSE_FILE" up -d --force-recreate --wait --wait-timeout 120 app

log "Cleaning unused Docker images"
docker image prune -f

log "Cleaning Docker build cache"
docker builder prune -f

# Uncomment only if you intentionally want to remove stopped containers.
# docker container prune -f

log "Backend deployed successfully"

exit 0

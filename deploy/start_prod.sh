#!/usr/bin/env bash
set -euo pipefail

# Start production stack using docker-compose.prod.yml
# Ensure .env is present with DB and OPENAI_API_KEY set.

COMPOSE_FILE=docker-compose.prod.yml

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "$COMPOSE_FILE not found in $(pwd)"
  exit 1
fi

echo "Starting production stack..."
docker compose -f $COMPOSE_FILE pull || true
docker compose -f $COMPOSE_FILE up -d --remove-orphans

echo "Services started. Check logs with: docker compose -f $COMPOSE_FILE logs -f"

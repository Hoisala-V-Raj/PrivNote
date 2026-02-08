#!/bin/bash

# Production database initialization script
# Run this after containers are up to initialize the database schema

set -e

echo "=========================================="
echo "Database Initialization"
echo "=========================================="

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✓ PostgreSQL is ready"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 1
done

# Create database if it doesn't exist
echo "Creating database..."
docker-compose exec -T postgres psql -U postgres -tc \
  "SELECT 1 FROM pg_database WHERE datname = 'privnote_db'" \
  | grep -q 1 || docker-compose exec -T postgres psql -U postgres -c \
  "CREATE DATABASE privnote_db OWNER postgres"

echo "Database initialization complete!"

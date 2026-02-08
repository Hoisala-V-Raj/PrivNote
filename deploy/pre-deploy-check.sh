#!/bin/bash

# Pre-deployment checklist script
# Validates environment and deployment readiness

set -e

echo "=========================================="
echo "Pre-Deployment Checklist"
echo "=========================================="

ERRORS=0

# Check Docker installation
echo -n "Checking Docker installation... "
if command -v docker &> /dev/null; then
  echo "✓"
else
  echo "✗ Docker not found"
  ERRORS=$((ERRORS + 1))
fi

# Check Docker Compose installation
echo -n "Checking Docker Compose installation... "
if command -v docker-compose &> /dev/null; then
  echo "✓"
else
  echo "✗ Docker Compose not found"
  ERRORS=$((ERRORS + 1))
fi

# Check .env file exists
echo -n "Checking .env file... "
if [ -f ".env" ]; then
  echo "✓"
else
  echo "✗ .env file not found"
  ERRORS=$((ERRORS + 1))
fi

# Check required environment variables
echo "Checking environment variables..."
REQUIRED_VARS=("DB_PASSWORD" "OPENAI_API_KEY" "NODE_ENV")
for var in "${REQUIRED_VARS[@]}"; do
  if grep -q "^$var=" .env; then
    echo "  ✓ $var"
  else
    echo "  ✗ $var missing"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check backend Dockerfile
echo -n "Checking backend Dockerfile... "
if [ -f "backend/Dockerfile" ]; then
  echo "✓"
else
  echo "✗ backend/Dockerfile not found"
  ERRORS=$((ERRORS + 1))
fi

# Check frontend Dockerfile
echo -n "Checking frontend Dockerfile... "
if [ -f "frontend/Dockerfile" ]; then
  echo "✓"
else
  echo "✗ frontend/Dockerfile not found"
  ERRORS=$((ERRORS + 1))
fi

# Check docker-compose.yml
echo -n "Checking docker-compose.yml... "
if [ -f "docker-compose.yml" ]; then
  echo "✓"
else
  echo "✗ docker-compose.yml not found"
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
  echo "✓ All checks passed! Ready to deploy."
  exit 0
else
  echo "✗ $ERRORS check(s) failed. Please fix above issues."
  exit 1
fi

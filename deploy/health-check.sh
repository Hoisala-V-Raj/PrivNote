#!/bin/bash

# Health Check Script
# Monitor application health and restart if needed

HEALTH_CHECK_URL="http://localhost:5000/health"
MAX_RETRIES=3
RETRY_DELAY=5

echo "Running health check at $(date)"

# Try to check backend health
for i in $(seq 1 $MAX_RETRIES); do
    if curl -f "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
        echo "✓ Health check passed"
        exit 0
    fi
    
    if [ $i -lt $MAX_RETRIES ]; then
        echo "Health check attempt $i failed, retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
    fi
done

# If we get here, health check failed
echo "✗ Health check failed after $MAX_RETRIES attempts"
echo "Restarting containers..."
docker-compose restart

echo "Health check completed at $(date)"

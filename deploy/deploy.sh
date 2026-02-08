#!/bin/bash

# Deployment Script for EC2
# Deploy or redeploy the application

set -e

echo "=========================================="
echo "PrivNote Deployment Script"
echo "=========================================="

# Pull latest changes
echo "Pulling latest changes from Git..."
git pull origin main

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    echo "Please create .env file with production variables"
    echo "Use .env.prod as reference"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '#' | xargs)

echo ""
echo "Stopping existing containers..."
docker-compose down

echo "Building Docker images..."
docker-compose build --no-cache

echo "Starting containers..."
docker-compose up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Verify health check
echo "Checking backend health..."
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✓ Backend is healthy"
else
    echo "✗ Backend health check failed"
fi

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo "Application running at:"
echo "- Frontend: http://${EC2_DOMAIN:-your-ec2-instance.com}"
echo "- Backend API: http://${EC2_DOMAIN:-your-ec2-instance.com}/api"
echo ""
echo "View logs: docker-compose logs -f"

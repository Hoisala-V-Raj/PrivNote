#!/usr/bin/env bash
set -euo pipefail

# Build images locally and save as tar files for transfer to remote host
# Usage: ./prepare_images.sh

echo "Building backend image..."
docker build -t privnote-backend:latest ./backend

echo "Building frontend image..."
docker build -t privnote-frontend:latest ./frontend

echo "Building nginx image..."
docker build -t privnote-nginx:latest ./nginx

mkdir -p images

echo "Saving images to images/"
docker save privnote-backend:latest -o images/privnote-backend.tar

docker save privnote-frontend:latest -o images/privnote-frontend.tar

docker save privnote-nginx:latest -o images/privnote-nginx.tar

echo "Done. Transfer images/ to your EC2 instance and load with 'docker load -i <file>'."
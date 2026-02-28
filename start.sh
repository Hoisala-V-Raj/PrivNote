#!/bin/bash
# PrivNote Local Startup Script

echo "Starting PrivNote..."

# Generate SSL certificates if they don't exist
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "Generating SSL certificates..."
    mkdir -p ssl
    openssl genrsa -out ssl/key.pem 2048 2>/dev/null
    openssl req -new -x509 -key ssl/key.pem -out ssl/cert.pem -days 365 \
      -subj "//C=US/ST=State/L=City/O=Org/CN=localhost" 2>/dev/null
    echo "✓ SSL certificates generated"
else
    echo "✓ SSL certificates found"
fi

# Start containers
echo "Starting Docker containers..."
docker-compose up -d

echo ""
echo "✓ PrivNote is running!"
echo "  Access at: http://localhost:3000"
echo ""
echo "To stop: docker-compose down"

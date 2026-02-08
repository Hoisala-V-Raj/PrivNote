#!/bin/bash

# SSL Certificate Setup with Let's Encrypt
# Configures SSL/TLS certificates for production

set -e

echo "=========================================="
echo "Setting up SSL/TLS with Let's Encrypt"
echo "=========================================="

# Check if domain is provided
if [ -z "$1" ]; then
    echo "Usage: ./setup-ssl.sh <your-domain.com>"
    echo "Example: ./setup-ssl.sh example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-admin@example.com}

echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Create ssl directory
mkdir -p ./ssl

# Stop nginx to allow certbot to bind to port 80
echo "Stopping nginx container..."
docker-compose stop nginx || true

echo "Requesting SSL certificate from Let's Encrypt..."
sudo certbot certonly \
    --standalone \
    --agree-tos \
    --no-eff-email \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Copy certificates to ssl directory
echo "Copying certificates..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./ssl/key.pem
sudo chown -R $USER:$USER ./ssl

# Update nginx configuration to use SSL
echo "Updating nginx configuration..."
sed -i "s/server_name _;/server_name $DOMAIN www.$DOMAIN;/g" ./nginx/nginx.conf
sed -i "s|# ssl_certificate|ssl_certificate|g" ./nginx/nginx.conf
sed -i "s|# ssl_certificate_key|ssl_certificate_key|g" ./nginx/nginx.conf
sed -i "s|# return 301|return 301|g" ./nginx/nginx.conf

echo "Starting nginx container..."
docker-compose up -d nginx

echo ""
echo "=========================================="
echo "SSL Setup Complete!"
echo "=========================================="
echo "Your site is now accessible at: https://$DOMAIN"
echo ""
echo "Certificate expires in 90 days"
echo "To renew automatically, set up a cron job:"
echo "0 0 1 * * /usr/bin/certbot renew --quiet && cd /path/to/PrivNote && docker-compose restart nginx"

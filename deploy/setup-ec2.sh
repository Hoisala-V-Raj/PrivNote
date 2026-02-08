#!/bin/bash

# EC2 Instance Setup Script
# Run this script on a fresh EC2 instance to install Docker and Docker Compose

set -e

echo "=========================================="
echo "PrivNote EC2 Instance Setup"
echo "=========================================="

# Update system packages
echo "Updating system packages..."
sudo yum update -y

# Install Docker
echo "Installing Docker..."
sudo amazon-linux-extras install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install git
echo "Installing Git..."
sudo yum install git -y

# Install certbot for SSL (optional, for Let's Encrypt)
echo "Installing Certbot for SSL..."
sudo yum install certbot python3-certbot-nginx -y

# Verify installations
echo ""
echo "=========================================="
echo "Verifying Installations"
echo "=========================================="
docker --version
docker-compose --version
git --version

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo "Next steps:"
echo "1. Clone the repository: git clone <repo-url>"
echo "2. Navigate to project: cd PrivNote"
echo "3. Create .env file with production variables"
echo "4. Run: docker-compose up -d"
echo "5. Set up SSL with: ./deploy/setup-ssl.sh"

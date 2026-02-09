# PrivNote Automated Deployment Script

## Overview

The `deploy.sh` script provides automated deployment of PrivNote with SSL/TLS support. It handles everything from repository cloning to container deployment.

## Quick Usage

1. **Copy to VM:**
   ```bash
   scp deploy.sh user@your-vm:/home/user/
   ```

2. **Make executable and run:**
   ```bash
   chmod +x deploy.sh
   sudo ./deploy.sh
   ```

## Script Features

- ✅ **Repository cloning** from GitHub
- ✅ **Self-signed SSL certificate** generation  
- ✅ **Nginx configuration** with SSL/TLS
- ✅ **Docker setup** and container deployment
- ✅ **Firewall configuration**
- ✅ **Llama 3 model** pulling
- ✅ **Production-ready configuration**

## Configuration

**Edit the script before running to change:**
```bash
DOMAIN="your-domain.com"  # Change from localhost
```

## Available Commands

```bash
sudo ./deploy.sh          # Full deployment
sudo ./deploy.sh update    # Update existing deployment
sudo ./deploy.sh ssl-only  # Generate SSL certificate only
sudo ./deploy.sh help      # Show help
```

## What Gets Installed

- Docker & Docker Compose
- Nginx (reverse proxy with SSL)
- PostgreSQL (database)
- Ollama (AI service)
- PrivNote application

## Access After Deployment

- **HTTPS**: `https://your-domain`
- **HTTP**: Redirects to HTTPS
- **Security Warning**: Self-signed cert - click "Proceed anyway"

## Directory Structure

```
/opt/privnote/
├── backend/          # Backend code
├── frontend/         # Frontend code  
├── docker-compose.yml # Docker configuration
├── .env            # Environment variables
└── ssl/            # SSL certificates
    ├── cert.pem
    └── key.pem
```

## Management Commands

```bash
# View logs
docker-compose -f /opt/privnote/docker-compose.yml logs -f

# Stop services
docker-compose -f /opt/privnote/docker-compose.yml down

# Update application
cd /opt/privnote && git pull && docker-compose up --build -d
```

## Security Notes

- Self-signed certificates show browser warnings
- For production, use Let's Encrypt or commercial certificates
- Firewall allows SSH (22), HTTP (80), HTTPS (443)
- Database password is auto-generated

## Troubleshooting

```bash
# Check container status
docker-compose -f /opt/privnote/docker-compose.yml ps

# Test Nginx config
sudo nginx -t

# Regenerate SSL
sudo rm -rf /opt/privnote/ssl/ && sudo ./deploy.sh ssl-only
```

The script is production-ready and handles all deployment aspects automatically!

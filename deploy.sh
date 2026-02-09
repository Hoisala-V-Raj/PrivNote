#!/bin/bash

# PrivNote Deployment Script
# This script clones the repository, sets up SSL certificates, configures TLS, and deploys the application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/Hoisala-V-Raj/PrivNote.git"
DEPLOY_DIR="/opt/privnote"
DOMAIN="localhost"  # Change this to your actual domain
SSL_DIR="/opt/privnote/ssl"
CERT_FILE="$SSL_DIR/cert.pem"
KEY_FILE="$SSL_DIR/key.pem"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Update package lists
    apt update
    
    # Install required packages
    apt install -y git docker.io docker-compose openssl nginx
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add current user to docker group
    usermod -aG docker $USER
    
    log_success "Dependencies installed successfully"
}

# Clone or update repository
setup_repository() {
    log_info "Setting up repository..."
    
    # Create deploy directory if it doesn't exist
    mkdir -p $DEPLOY_DIR
    
    # Clone repository if it doesn't exist
    if [ ! -d "$DEPLOY_DIR/.git" ]; then
        log_info "Cloning repository..."
        git clone $REPO_URL $DEPLOY_DIR
    else
        log_info "Updating existing repository..."
        cd $DEPLOY_DIR
        git pull origin main
    fi
    
    cd $DEPLOY_DIR
    log_success "Repository setup completed"
}

# Generate self-signed SSL certificate
generate_ssl_certificate() {
    log_info "Generating self-signed SSL certificate..."
    
    # Create SSL directory
    mkdir -p $SSL_DIR
    
    # Generate private key
    openssl genrsa -out $KEY_FILE 2048
    
    # Generate certificate
    openssl req -new -x509 -key $KEY_FILE -out $CERT_FILE -days 365 \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    # Set proper permissions
    chmod 600 $KEY_FILE
    chmod 644 $CERT_FILE
    
    log_success "SSL certificate generated successfully"
    log_warning "This is a self-signed certificate. Browsers will show security warnings."
}

# Configure Nginx with SSL
configure_nginx() {
    log_info "Configuring Nginx with SSL..."
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/privnote << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate $CERT_FILE;
    ssl_certificate_key $KEY_FILE;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Proxy to frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Proxy to backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable the site
    ln -sf /etc/nginx/sites-available/privnote /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    nginx -t
    
    # Restart Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    log_success "Nginx configured successfully"
}

# Update Docker Compose for production
update_docker_compose() {
    log_info "Updating Docker Compose configuration for production..."
    
    # Update docker-compose.yml with production settings
    cat > $DEPLOY_DIR/docker-compose.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: privnote-postgres
    environment:
      POSTGRES_DB: privnote
      POSTGRES_USER: privnote
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-privnote123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - privnote-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U privnote"]
      interval: 30s
      timeout: 10s
      retries: 3

  ollama:
    image: ollama/ollama:latest
    container_name: privnote-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    networks:
      - privnote-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://privnote:${POSTGRES_PASSWORD:-privnote123}@postgres:5432/privnote
      OLLAMA_URL: "http://ollama:11434"
      USE_MOCK_SUMMARIZER: "false"
      FRONTEND_URL: "https://$DOMAIN"
      NODE_ENV: "production"
    depends_on:
      postgres:
        condition: service_healthy
      ollama:
        condition: service_started
    networks:
      - privnote-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: "https://$DOMAIN/api"
    depends_on:
      - backend
    networks:
      - privnote-network
    restart: unless-stopped

volumes:
  ollama_data:
    driver: local
  postgres_data:
    driver: local

networks:
  privnote-network:
    driver: bridge
EOF

    # Create .env file with secure defaults
    cat > $DEPLOY_DIR/.env << EOF
# Database Configuration
POSTGRES_PASSWORD=privnote123_$(date +%s)

# Application Configuration
FRONTEND_URL=https://$DOMAIN
USE_MOCK_SUMMARIZER=false

# SSL Configuration
SSL_CERT_PATH=$CERT_FILE
SSL_KEY_PATH=$KEY_FILE
POSTGRES_DB=privnote
POSTGRES_USER=privnote
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
EOF

    log_success "Docker Compose configuration updated"
}

# Build and start Docker containers
deploy_containers() {
    log_info "Building and starting Docker containers..."
    
    cd $DEPLOY_DIR
    
    # Pull latest images
    docker-compose pull
    
    # Build and start containers
    docker-compose down
    docker-compose up --build -d
    
    # Wait for containers to be ready
    log_info "Waiting for containers to be ready..."
    sleep 30
    
    # Pull Llama model
    log_info "Pulling Llama 3 model..."
    docker-compose exec ollama ollama pull llama3
    
    # Check container status
    docker-compose ps
    
    log_success "Containers deployed successfully"
}

# Setup firewall
setup_firewall() {
    log_info "Configuring firewall..."
    
    # Allow SSH, HTTP, and HTTPS
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable firewall (non-interactive)
    ufw --force enable
    
    log_success "Firewall configured"
}

# Main deployment function
main() {
    log_info "Starting PrivNote deployment..."
    
    check_root
    install_dependencies
    setup_repository
    generate_ssl_certificate
    configure_nginx
    update_docker_compose
    deploy_containers
    setup_firewall
    
    log_success "Deployment completed successfully!"
    echo ""
    echo -e "${GREEN}PrivNote is now running at: https://$DOMAIN${NC}"
    echo -e "${YELLOW}Note: Since this uses a self-signed certificate, you'll see a security warning in your browser.${NC}"
    echo -e "${YELLOW}You can safely proceed past the warning to access the application.${NC}"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo "- View logs: docker-compose -f $DEPLOY_DIR/docker-compose.yml logs -f"
    echo "- Stop services: docker-compose -f $DEPLOY_DIR/docker-compose.yml down"
    echo "- Update: cd $DEPLOY_DIR && git pull && docker-compose up --build -d"
}

# Handle command line arguments
case "${1:-}" in
    "ssl-only")
        log_info "Generating SSL certificate only..."
        check_root
        generate_ssl_certificate
        log_success "SSL certificate generated"
        ;;
    "update")
        log_info "Updating existing deployment..."
        setup_repository
        deploy_containers
        log_success "Update completed"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [ssl-only|update|help]"
        echo ""
        echo "Commands:"
        echo "  ssl-only    Generate SSL certificate only"
        echo "  update      Update existing deployment"
        echo "  help        Show this help message"
        echo ""
        echo "Default: Full deployment"
        ;;
    *)
        main
        ;;
esac

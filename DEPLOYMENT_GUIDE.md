# PrivNote Production Deployment Guide

Complete step-by-step guide to deploy PrivNote on AWS EC2 with SSL/TLS, monitoring, and backups.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS EC2 Setup](#aws-ec2-setup)
3. [Initial Server Configuration](#initial-server-configuration)
4. [Application Deployment](#application-deployment)
5. [SSL/TLS Configuration](#ssltls-configuration)
6. [Production Monitoring](#production-monitoring)
7. [Backup & Recovery](#backup--recovery)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### AWS Account & EC2 Instance

1. **Create EC2 Instance:**
   - AMI: Amazon Linux 2 (ami-0c55b159cbfafe1f0)
   - Instance Type: t3.medium (or t3.small for lower cost)
   - Storage: 30GB EBS (gp3)
   - Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

2. **Create Elastic IP:** (keeps IP address consistent)
   - Allocate new elastic IP
   - Associate with EC2 instance

3. **Domain Name:**
   - Point A record to Elastic IP
   - Verify DNS resolution: `nslookup your-domain.com`

4. **Git Repository:**
   - GitHub/GitLab repository with project code
   - Personal access token for authentication

### Required Credentials

- OpenAI API key (for AI summarization)
- Domain registrar access (for DNS)
- SSH key pair (.pem file)
- Optional: AWS Systems Manager Session Manager setup

---

## AWS EC2 Setup

### Step 1: Launch Instance

```bash
# Connect to your instance
ssh -i your-key.pem ec2-user@your-elastic-ip
```

### Step 2: System Update

```bash
# Update all packages
sudo yum update -y

# Install useful tools
sudo yum install -y curl wget git htop
```

### Step 3: Docker Installation

The `deploy/setup-ec2.sh` script automates this, but manual steps:

```bash
# Install Docker
sudo amazon-linux-extras install docker -y
sudo systemctl start docker
sudo systemctl enable docker

# Add ec2-user to docker group
sudo usermod -a -G docker ec2-user

# Log out and back in to apply group changes
exit
ssh -i your-key.pem ec2-user@your-elastic-ip

# Verify Docker installation
docker --version
docker run hello-world
```

### Step 4: Docker Compose Installation

```bash
# Download latest Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### Step 5: Node and npm (Optional, for direct TypeScript compilation)

```bash
# Install Node Version Manager (NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node 20
nvm install 20
node --version
npm --version
```

---

## Initial Server Configuration

### Step 1: Clone Repository

```bash
# Clone the project
git clone https://github.com/your-username/privnote.git
cd privnote

# Or if private repo
git clone https://your-token@github.com/your-username/privnote.git
cd privnote
```

### Step 2: Create Environment File

```bash
# Copy production template
cp .env.prod .env

# Edit with secure values
nano .env
```

**Required Environment Variables:**

```env
# Server
NODE_ENV=production
PORT=5000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-very-secure-password-here
DB_NAME=privnote_db

# Frontend
VITE_API_URL=https://your-domain.com/api
FRONTEND_URL=https://your-domain.com

# AI Provider
OPENAI_API_KEY=sk-...your-key...

# Security
CORS_ORIGIN=https://your-domain.com

# Deployment
EC2_DOMAIN=your-domain.com
EC2_INSTANCE_IP=your-elastic-ip
```

**🔐 Security Tips:**
- Use strong passwords (16+ characters, mix of uppercase, lowercase, numbers, symbols)
- Store credentials in AWS Secrets Manager for added security
- Rotate OPENAI_API_KEY monthly
- Never commit .env to version control

### Step 3: Make Scripts Executable

```bash
chmod +x deploy/*.sh

# Verify scripts
ls -la deploy/
```

### Step 4: Run Pre-Deployment Check

```bash
./deploy/pre-deploy-check.sh
```

---

## Application Deployment

### Step 1: Initialize Database

```bash
# Start all containers
docker-compose up -d

# Wait for services to be healthy (30-60 seconds)
sleep 60

# Initialize database schema
./deploy/init-db.sh

# Verify database connection
docker-compose exec postgres pg_isready -U postgres
```

### Step 2: Run Database Migrations

```bash
# Inside backend container, run TypeORM migrations
docker-compose exec backend npm run migration:run

# Or if using built version
docker-compose exec backend npx typeorm migration:run
```

### Step 3: Verify Services

```bash
# Check all containers are running
docker-compose ps

# Expected output:
# NAME              STATUS
# privnote-postgres running (healthy)
# privnote-backend  running
# privnote-frontend running
# privnote-nginx    running
```

### Step 4: Test Application

```bash
# Backend health check
curl http://localhost:5000/health

# Frontend (should be proxied through nginx)
curl http://localhost/

# Test API endpoint
curl -X POST http://localhost:5000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"note":"Test note"}'
```

### Step 5: Monitor Logs

```bash
# View all logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
docker-compose logs -f postgres

# Save logs to file
docker-compose logs > deployment.log
```

---

## SSL/TLS Configuration

### Step 1: Install Certbot

```bash
sudo yum install certbot python3-certbot-nginx -y
```

### Step 2: Request Certificate

```bash
./deploy/setup-ssl.sh your-domain.com admin@example.com
```

This script:
- Stops nginx temporarily
- Requests certificate from Let's Encrypt
- Configures nginx for HTTPS
- Enables automatic HTTP → HTTPS redirect

### Step 3: Verify Certificate

```bash
# Check certificate status
sudo certbot certificates

# Test HTTPS
curl https://your-domain.com/health

# Check SSL/TLS grade (online tool)
# https://www.ssllabs.com/ssltest/
```

### Step 4: Automatic Renewal

Let's Encrypt certificates expire in 90 days. Set up auto-renewal:

```bash
# Add to crontab
sudo crontab -e

# Add this line (runs at 1 AM daily)
0 1 * * * /usr/bin/certbot renew --quiet && cd /home/ec2-user/privnote && docker-compose restart nginx

# Verify cron is scheduled
sudo crontab -l
```

### Step 5: Test Auto-Renewal (Optional)

```bash
# Dry run to test renewal without modifying certificates
sudo certbot renew --dry-run
```

---

## Production Monitoring

### Step 1: Container Health Checks

```bash
# Automated health check script
./deploy/health-check.sh

# Add to crontab for continuous monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ec2-user/privnote/deploy/health-check.sh >> /tmp/health-check.log 2>&1") | crontab -
```

### Step 2: View System Metrics

```bash
# Real-time container stats
docker stats

# CPU, Memory, Network I/O
docker-compose stats

# Individual container resource usage
docker inspect privnote-backend | grep -A 10 Memory
```

### Step 3: Database Monitoring

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d privnote_db

# In psql, useful commands:
\dt                           # List tables
SELECT COUNT(*) FROM notes;   # Count notes
SELECT * FROM notes LIMIT 5;  # View recent notes
\q                            # Quit
```

### Step 4: Application Logs Analysis

```bash
# Search for errors in the last hour
docker-compose logs --since 60m backend | grep -i error

# Count API requests by endpoint
docker-compose logs backend | grep POST | wc -l

# Find rate limiting events
docker-compose logs nginx | grep "Too many requests"

# Export logs for analysis
docker-compose logs > logs-$(date +%Y%m%d).log
```

### Step 5: Monitor OpenAI API Usage

```bash
# Set up cost alerts in OpenAI dashboard
# https://platform.openai.com/account/billing/limits

# Track API calls per note
curl -X GET http://localhost:5000/api/notes \
  -H "Authorization: Bearer admin_token" \
  | jq '.summaryGeneratedAt' | grep -v null | wc -l
```

---

## Backup & Recovery

### Step 1: Database Backup

**Manual backup:**

```bash
# Create backup directory
mkdir -p /home/ec2-user/backups

# Backup database
docker-compose exec postgres pg_dump -U postgres privnote_db > \
  /home/ec2-user/backups/privnote_db_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh /home/ec2-user/backups/
```

**Automated daily backups:**

```bash
# Create backup script
cat > /home/ec2-user/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ec2-user/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump -U postgres privnote_db > \
  $BACKUP_DIR/privnote_db_$TIMESTAMP.sql

# Keep only last 30 days of backups
find $BACKUP_DIR -name "privnote_db_*.sql" -mtime +30 -delete

echo "Backup completed: privnote_db_$TIMESTAMP.sql"
EOF

chmod +x /home/ec2-user/backup-db.sh

# Add to crontab (runs daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ec2-user/backup-db.sh") | crontab -
```

**Upload to S3 (recommended):**

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure

# Update backup script to upload to S3
cat > /home/ec2-user/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ec2-user/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="your-backup-bucket"

mkdir -p $BACKUP_DIR

# Create backup
docker-compose exec -T postgres pg_dump -U postgres privnote_db > \
  $BACKUP_DIR/privnote_db_$TIMESTAMP.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/privnote_db_$TIMESTAMP.sql \
  s3://$S3_BUCKET/privnote-backups/

# Clean up local backups
find $BACKUP_DIR -name "privnote_db_*.sql" -mtime +7 -delete

echo "Backup completed and uploaded to S3"
EOF
```

### Step 2: Database Recovery

```bash
# List available backups
ls -la /home/ec2-user/backups/

# Restore from backup
docker-compose exec -T postgres psql -U postgres privnote_db < \
  /home/ec2-user/backups/privnote_db_20240115_020000.sql

# Verify restored data
docker-compose exec postgres psql -U postgres -d privnote_db -c \
  "SELECT COUNT(*) FROM notes;"
```

### Step 3: Volume Backups

```bash
# Backup PostgreSQL data volume
docker run --rm \
  -v privnote_postgres_data:/data \
  -v /home/ec2-user/backups:/backup \
  alpine tar czf /backup/postgres_volume_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Restore volume backup
docker run --rm \
  -v privnote_postgres_data:/data \
  -v /home/ec2-user/backups:/backup \
  alpine tar xzf /backup/postgres_volume_20240115_020000.tar.gz -C /data .
```

---

## Troubleshooting

### Container Won't Start

```bash
# View detailed error logs
docker-compose logs backend

# Check specific error
docker-compose logs backend | grep -i "error\|failed"

# Restart container with verbose output
docker-compose restart backend
docker-compose logs -f backend
```

### Database Connection Issues

```bash
# Verify database is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres pg_isready -U postgres

# Check environment variables
docker-compose exec backend env | grep DB_

# Verify DATABASE_URL is correct
docker-compose exec backend env | grep DATABASE
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Increase Docker memory limits in docker-compose.yml
# Add to service: mem_limit: 2gb

# Restart containers
docker-compose restart

# Monitor memory trends
watch -n 1 'docker stats --no-stream'
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Find large files
du -sh /* | sort -rh

# Clean up old Docker images
docker image prune -a

# Clean up unused volumes
docker volume prune

# Truncate old logs
find /var/lib/docker/containers -name "*.log" -exec truncate -s 0 {} \;
```

### SSL Certificate Not Renewing

```bash
# Check certificate status
sudo certbot certificates

# View renewal log
sudo journalctl -u certbot

# Manual renewal
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Test renewal
sudo certbot renew --dry-run
```

### High API Response Time

```bash
# Check backend logs for slow queries
docker-compose logs backend | grep "Query time"

# Monitor database performance
docker-compose exec postgres \
  psql -U postgres -d privnote_db -c \
  "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;"

# Check API rate limiting
docker-compose logs nginx | grep "rate limit"
```

---

## Production Checklist

### Pre-Launch
- [ ] Domain configured with Elastic IP
- [ ] SSL certificate installed and auto-renewal enabled
- [ ] All environment variables set (including sensitive ones)
- [ ] Database password changed from default
- [ ] OpenAI API key configured
- [ ] Security group configured (ports 22, 80, 443 only)
- [ ] Backup strategy implemented
- [ ] Health checks enabled
- [ ] Monitoring scripts scheduled in cron
- [ ] Team has SSH access

### Post-Launch
- [ ] Test all API endpoints
- [ ] Verify SSL certificate (https://your-domain.com)
- [ ] Monitor logs for first 24 hours
- [ ] Set up cost alerts (AWS, OpenAI)
- [ ] Configure CloudWatch alarms
- [ ] Test database backup/restore
- [ ] Document deployment details
- [ ] Schedule team training on operations

### Ongoing
- [ ] Review logs weekly for errors
- [ ] Monitor API costs monthly
- [ ] Test backup/restore quarterly
- [ ] Update Docker images monthly
- [ ] Rotate sensitive credentials quarterly
- [ ] Review security group rules monthly

---

## Performance Tuning

### Database Optimization

```bash
# Create indexes for frequently queried fields
docker-compose exec postgres psql -U postgres -d privnote_db << EOF
CREATE INDEX idx_notes_created_at ON notes(created_at);
CREATE INDEX idx_notes_summary_generated_at ON notes(summary_generated_at);
EOF

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM notes WHERE created_at > NOW() - INTERVAL '7 days';
```

### Connection Pooling

```bash
# Add pgBouncer for connection pooling
docker-compose up -d pgbouncer
```

### Caching Strategy

```bash
# Add Redis for summary caching
docker-compose up -d redis

# Update backend to use Redis
# See backend/src/services/cacheService.ts
```

---

## Support & Escalation

### Common Issues Contact

- **Docker Issues:** Docker Community Forums
- **PostgreSQL Issues:** PostgreSQL Documentation
- **OpenAI API Issues:** OpenAI Support Portal
- **AWS/EC2 Issues:** AWS Support Center

### Emergency Procedures

**If application is down:**

1. Check service status: `docker-compose ps`
2. View logs: `docker-compose logs`
3. Restart services: `docker-compose restart`
4. Check disk space: `df -h`
5. Check memory: `free -h`
6. Reboot instance if needed: `sudo reboot`

**If database is corrupted:**

1. Stop services: `docker-compose down`
2. Restore from backup: See Backup & Recovery section
3. Start services: `docker-compose up -d`
4. Verify data: `docker-compose exec postgres psql -U postgres -d privnote_db -c "SELECT COUNT(*) FROM notes;"`

---

## Next Steps

1. Deploy to EC2 following above steps
2. Monitor application for 1 week
3. Set up automated backups
4. Configure alerts for high error rates
5. Plan scaling strategy (if needed)
6. Document runbooks for your team

---

**Last Updated:** February 7, 2026  
**Document Version:** 1.0

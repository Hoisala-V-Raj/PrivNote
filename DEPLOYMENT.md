# PrivNote: Complete Deployment & Testing Guide

## Current Status

✅ **Completed:**
- Backend API (Express + TypeORM + PostgreSQL) running at `http://localhost:5000`
- Frontend UI (React + Vite + Tailwind) running at `http://localhost:3000`
- Database initialized with schema and migrations
- Mock summarizer (local LLM mode) enabled and tested
- Rate limiting and password authentication in place
- Docker images building successfully

✅ **Ready to Test:**
- Open http://localhost:3000 in browser
- Create a note via the UI
- Retrieve note with password
- Summarize note via mock summarizer

## Building Production Images

Run these commands to build and export Docker images for EC2 transfer:

```bash
cd C:\Users\hoisa\OneDrive\Desktop\PrivNote

# Build all images
docker build -t privnote-backend:latest ./backend
docker build -t privnote-frontend:latest ./frontend
docker build -t privnote-nginx:latest ./nginx

# Export as tar files (optional - for air-gapped transfer to EC2)
mkdir -p images
docker save privnote-backend:latest -o images/privnote-backend.tar
docker save privnote-frontend:latest -o images/privnote-frontend.tar
docker save privnote-nginx:latest -o images/privnote-nginx.tar

# Or push to a registry (ECR, Docker Hub) instead
```

## Running Tests

### Backend Tests (Jest)
```bash
cd C:\Users\hoisa\OneDrive\Desktop\PrivNote\backend
npm test
```

Tests cover:
- Input validation (empty notes, character limits)
- Password hashing and verification
- Password generation format

### Frontend Tests (Vitest)
```bash
cd C:\Users\hoisa\OneDrive\Desktop\PrivNote\frontend
npm test
```

### Integration Testing (Local)
1. Open http://localhost:3000
2. Create a test note with any text
3. Copy the generated share URL
4. Open in a new tab and unlock with the password
5. Click "Summarize" to test the mock summarizer

## EC2 Deployment Steps

### 1. Prepare EC2 Instance (Ubuntu 22.04 LTS recommended)

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run setup script to install Docker and docker-compose
wget https://your-repo/deploy/setup_ec2.sh
chmod +x setup_ec2.sh
sudo ./setup_ec2.sh

# Log out and back in to apply docker group changes
```

### 2. Transfer Application Files & Images

```bash
# On local machine: copy images and config to EC2
scp -i your-key.pem -r ./images ./docker-compose.prod.yml ubuntu@your-ec2-ip:~/privnote/

# Or use rsync for faster transfer of large files
rsync -avz -e "ssh -i your-key.pem" ./images ubuntu@your-ec2-ip:~/privnote/
```

### 3. Load Docker Images on EC2

```bash
# On EC2
cd ~/privnote

# Load all saved images
docker load -i images/privnote-backend.tar
docker load -i images/privnote-frontend.tar
docker load -i images/privnote-nginx.tar

# Or pull from registry if using ECR/Docker Hub
```

### 4. Set Production Environment

```bash
# Create .env file with production secrets
cat > .env << 'EOF'
DB_USER=postgres
DB_PASSWORD=YOUR_STRONG_DB_PASSWORD
DB_NAME=privnote_db
OPENAI_API_KEY=YOUR_OPENAI_KEY_HERE
CORS_ORIGIN=https://your-domain.com
VITE_API_URL=https://your-domain.com/api
EOF

chmod 600 .env
```

### 5. Start Production Stack

```bash
docker compose -f docker-compose.prod.yml up -d

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Verify services are healthy
docker ps
```

The app will be accessible at:
- Frontend: http://your-ec2-ip:3000
- Backend API: http://your-ec2-ip:5000
- Full stack via nginx: http://your-ec2-ip

## SSL/TLS Setup (Let's Encrypt)

### Option 1: Certbot on Host (Recommended)

```bash
# On EC2
sudo apt-get install certbot python3-certbot-nginx -y

# Get certificates (replace with your domain)
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com

# Configure nginx to use certs
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/

# Update docker-compose.prod.yml nginx volume in .env or yml
# Restart nginx
docker restart privnote-nginx

# Auto-renewal (certbot handles this)
sudo systemctl enable certbot.timer
```

### Option 2: AWS Certificate Manager (ACM) with ALB

If using an Application Load Balancer:
1. Request a certificate in ACM for your domain
2. Create ALB with ACM certificate
3. Point Route53 DNS to ALB
4. Update CORS_ORIGIN in .env to match your domain
5. Restart backend container

## Production Nginx Configuration

Nginx routes:
- `/api/*` → backend:5000
- `/*` → frontend:3000 (static assets + SPA routing)
- HTTP redirects to HTTPS (if SSL enabled)

Edit [nginx/nginx.conf](nginx/nginx.conf) for custom routes or SSL paths.

## Monitoring & Logs

```bash
# View all service logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f postgres

# Check container stats
docker stats

# Inspect database
docker exec privnote-db psql -U postgres -d privnote_db -c "SELECT COUNT(*) FROM notes;"
```

## Backup & Recovery

### Database Backup
```bash
docker exec privnote-db pg_dump -U postgres privnote_db > backup.sql
```

### Database Restore
```bash
docker exec -i privnote-db psql -U postgres privnote_db < backup.sql
```

### Docker Volume Backup
```bash
docker run --rm -v privnote_postgres_data:/data \
  -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz /data
```

## Troubleshooting

### Backend can't connect to Postgres
- Check `docker ps` to ensure `privnote-db` is running
- Verify DB_HOST (should be `postgres` in container, `localhost` on host)
- Check database logs: `docker logs privnote-db`

### Frontend API calls timing out
- Verify CORS_ORIGIN in .env matches frontend domain
- Check backend logs for errors
- Ensure backend container has network access to postgres

### Summarization not working
- If using OpenAI: check OPENAI_API_KEY and account quota
- If using mock: verify USE_MOCK_SUMMARIZER=true in docker-compose
- Check backend logs for LLM service errors

### Nginx not routing correctly
- Verify nginx container is running: `docker ps | grep nginx`
- Check nginx logs: `docker logs privnote-nginx`
- Test backend directly: `curl http://localhost:5000/health`
- Test frontend directly: `curl http://localhost:3000`

## Security Checklist

- [ ] Set strong DB_PASSWORD in .env
- [ ] Rotate OpenAI API key if exposed
- [ ] Use HTTPS only in production (SSL enabled)
- [ ] Keep Docker images updated
- [ ] Monitor logs for suspicious activity
- [ ] Use AWS Security Groups to restrict inbound traffic
- [ ] Enable database encryption at rest (RDS if available)
- [ ] Implement secret management (AWS Secrets Manager, HashiCorp Vault)

## Performance Tuning

### Database
- Add indexes on frequently queried columns (id, createdAt)
- Enable connection pooling with PgBouncer if many clients

### Backend
- Increase Node.js memory limit if needed: `NODE_OPTIONS=--max-old-space-size=2048`
- Use Redis for caching summaries (currently in-memory per instance)
- Load balance multiple backend instances behind Nginx

### Frontend
- Enable gzip compression in Nginx
- Use CDN (CloudFront) for static assets
- Lazy load components

## Next Steps

1. **Test locally** - create a few notes, test unlock/summarize flow
2. **Build images** - run `docker build` commands above
3. **Provision EC2** - t3.medium or t3.large recommended
4. **Deploy** - follow EC2 deployment section
5. **Configure DNS** - point domain to EC2 EIP or ALB
6. **Enable SSL** - use Certbot + Let's Encrypt
7. **Monitor** - set up CloudWatch alarms or similar
8. **Scale** - add more backend instances, set up RDS, etc.

## Support & Documentation

- Backend API Docs: [backend/README.md](backend/README.md)
- Frontend README: [frontend/README.md](frontend/README.md)
- Deployment Scripts: [deploy/](deploy/)
- Project Spike Doc: [SPIKE.md](SPIKE.md)

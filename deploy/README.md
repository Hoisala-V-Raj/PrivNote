Deployment steps for EC2 (manual transfer):

1. Build and export images locally (on your workstation):

```bash
cd /path/to/PrivNote
./deploy/prepare_images.sh
```

2. Transfer `images/` and `docker-compose.prod.yml` to your EC2 host (using scp / rsync).

3. On EC2, load images:

```bash
docker load -i privnote-backend.tar
docker load -i privnote-frontend.tar
docker load -i privnote-nginx.tar
```

4. Place your production `.env` on the EC2 host with `DB_*` and `OPENAI_API_KEY` set.

5. Start services on EC2:

```bash
docker compose -f docker-compose.prod.yml up -d
```

6. Configure DNS to point your domain to the EC2 instance IP and set up SSL (see below).

SSL (Let's Encrypt) (recommended):
- Use Certbot on the EC2 host to obtain certs and mount them into `./ssl` before starting the nginx container.
- Alternatively, use a reverse proxy on host or AWS Load Balancer with ACM certs.

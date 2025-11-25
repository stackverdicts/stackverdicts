# VPS Deployment Guide - NameCheap/DigitalOcean/Vultr

## Overview

Deploy your complete StackVerdicts platform (backend + frontend + database) on a single VPS for $6-10/month.

**What You Get:**
- ✅ Full admin dashboard
- ✅ Real-time content updates
- ✅ All features working (newsletter, analytics, etc.)
- ✅ MySQL database
- ✅ No static builds needed
- ✅ Custom domain support

---

## Prerequisites

- VPS account (NameCheap, DigitalOcean, Vultr, or Linode)
- Domain name (optional, can use IP initially)
- SSH client (Terminal on Mac, PuTTY on Windows)

---

## Step 1: VPS Setup

### Recommended Specs:

**Minimum:**
- 1 CPU core
- 2GB RAM
- 50GB storage
- Ubuntu 22.04 LTS

**NameCheap VPS Options:**
- **Pulsar** ($6.88/month) - Good for starting
- **Quasar** ($11.88/month) - Recommended for better performance

### Initial Server Setup:

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Create a non-root user
adduser stackverdicts
usermod -aG sudo stackverdicts

# Switch to new user
su - stackverdicts
```

---

## Step 2: Install Required Software

### Install Node.js (v18+):

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload bash
source ~/.bashrc

# Install Node.js
nvm install 18
nvm use 18
node --version  # Should show v18.x.x
```

### Install MySQL:

```bash
# Install MySQL Server
sudo apt install mysql-server -y

# Secure MySQL installation
sudo mysql_secure_installation

# Log into MySQL
sudo mysql

# Create database and user
CREATE DATABASE stackverdicts;
CREATE USER 'stackverdicts'@'localhost' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON stackverdicts.* TO 'stackverdicts'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Install Nginx:

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install PM2 (Process Manager):

```bash
npm install -g pm2
```

### Install Git:

```bash
sudo apt install git -y
```

---

## Step 3: Deploy Your Application

### Clone Your Repository:

```bash
cd ~
git clone https://github.com/yourusername/automated-affiliate-hub.git
cd automated-affiliate-hub
```

**OR** if you don't have a GitHub repo, upload files via SFTP/SCP:

```bash
# From your local machine
scp -r /Users/dan.green/PhpstormProjects/automated-affiliate-hub stackverdicts@your-vps-ip:~/
```

### Set Up Backend:

```bash
cd ~/automated-affiliate-hub/backend

# Install dependencies
npm install

# Create .env file
nano .env
```

**Backend .env contents:**

```env
NODE_ENV=production
PORT=3001

# Database
DB_HOST=localhost
DB_USER=stackverdicts
DB_PASSWORD=your-secure-password
DB_NAME=stackverdicts

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI (if using AI features)
OPENAI_API_KEY=your-openai-key

# Session
SESSION_SECRET=your-session-secret-change-this

# CORS
CORS_ORIGIN=http://your-domain.com,https://your-domain.com
```

**Run migrations:**

```bash
npm run migrate
# Or run migrations manually if you have them
```

**Start backend with PM2:**

```bash
pm2 start npm --name "stackverdicts-backend" -- run start
pm2 save
pm2 startup  # Follow the instructions it gives you
```

### Set Up Frontend:

```bash
cd ~/automated-affiliate-hub/frontend

# Install dependencies
npm install

# Create .env.local file
nano .env.local
```

**Frontend .env.local contents:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
# or if using domain:
# NEXT_PUBLIC_API_URL=https://your-domain.com
```

**Build Next.js:**

```bash
npm run build
```

**Start frontend with PM2:**

```bash
pm2 start npm --name "stackverdicts-frontend" -- run start
pm2 save
```

**Check status:**

```bash
pm2 status
pm2 logs
```

---

## Step 4: Configure Nginx

### Create Nginx Configuration:

```bash
sudo nano /etc/nginx/sites-available/stackverdicts
```

**Nginx config:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# Main server block
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (we'll set these up next)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**For development/testing without SSL (HTTP only):**

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable the site:**

```bash
sudo ln -s /etc/nginx/sites-available/stackverdicts /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## Step 5: Set Up SSL (Free with Let's Encrypt)

### Install Certbot:

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Get SSL Certificate:

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**Follow the prompts:**
- Enter your email
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (choose Yes)

**Auto-renewal is set up automatically!** Test it:

```bash
sudo certbot renew --dry-run
```

---

## Step 6: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Step 7: Point Domain to VPS

1. **Get your VPS IP address:**
   ```bash
   curl ifconfig.me
   ```

2. **Update DNS records** in NameCheap (or your domain registrar):
   - **A Record:** `@` → `your-vps-ip`
   - **A Record:** `www` → `your-vps-ip`

3. **Wait for DNS propagation** (5 minutes to 48 hours, usually ~15 min)

4. **Test:** Visit `http://your-domain.com`

---

## Step 8: Monitoring & Maintenance

### Check Application Status:

```bash
pm2 status
pm2 logs stackverdicts-backend
pm2 logs stackverdicts-frontend
```

### Restart Applications:

```bash
pm2 restart stackverdicts-backend
pm2 restart stackverdicts-frontend
```

### View Nginx Logs:

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Update Application:

```bash
cd ~/automated-affiliate-hub
git pull  # or upload new files via SFTP

# Backend
cd backend
npm install
pm2 restart stackverdicts-backend

# Frontend
cd ../frontend
npm install
npm run build
pm2 restart stackverdicts-frontend
```

---

## Step 9: Database Backups

### Automated Daily Backups:

```bash
# Create backup script
nano ~/backup-db.sh
```

**Script contents:**

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d-%H%M)
BACKUP_DIR="$HOME/backups"
mkdir -p $BACKUP_DIR

mysqldump -u stackverdicts -p'your-password' stackverdicts > $BACKUP_DIR/stackverdicts-$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "stackverdicts-*.sql" -mtime +7 -delete
```

**Make executable and schedule:**

```bash
chmod +x ~/backup-db.sh

# Add to crontab (runs daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /home/stackverdicts/backup-db.sh
```

---

## Troubleshooting

### Frontend not loading:

```bash
pm2 logs stackverdicts-frontend
# Check if Next.js built successfully
cd ~/automated-affiliate-hub/frontend
npm run build
```

### Backend API errors:

```bash
pm2 logs stackverdicts-backend
# Check database connection
mysql -u stackverdicts -p stackverdicts
```

### Nginx errors:

```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Port already in use:

```bash
# Kill process on port 3000 or 3001
sudo lsof -ti:3000 | xargs kill
sudo lsof -ti:3001 | xargs kill
```

---

## Cost Breakdown

| Service | Monthly Cost |
|---------|-------------|
| NameCheap VPS (Pulsar) | $6.88 |
| Domain (.com) | ~$1 (if new) |
| SSL Certificate | $0 (Let's Encrypt) |
| **Total** | **~$8/month** |

**Compare to:**
- Vercel Pro: $20/month
- Heroku: $25/month
- AWS/DigitalOcean managed: $30+/month

---

## Performance Optimization

### Enable Gzip:

```nginx
# Add to nginx.conf
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### PM2 Cluster Mode:

```bash
pm2 delete stackverdicts-frontend
pm2 start npm --name "stackverdicts-frontend" -i max -- run start
```

### Node.js Optimization:

```bash
# Set Node environment
export NODE_ENV=production

# Increase memory if needed
pm2 start npm --name "stackverdicts-backend" --max-memory-restart 500M -- run start
```

---

## Security Best Practices

1. ✅ **Use strong passwords** for database and SSH
2. ✅ **Disable root SSH login**
3. ✅ **Use SSH keys** instead of passwords
4. ✅ **Keep system updated:** `sudo apt update && sudo apt upgrade`
5. ✅ **Use firewall** (UFW configured above)
6. ✅ **Enable fail2ban** to prevent brute force:
   ```bash
   sudo apt install fail2ban -y
   sudo systemctl enable fail2ban
   ```

---

## Next Steps

1. ✅ Deploy your application
2. ✅ Set up SSL certificate
3. ✅ Configure automated backups
4. ✅ Monitor with PM2
5. 🎉 **Your site is live!**

Access your site at: `https://your-domain.com`
Access admin at: `https://your-domain.com/admin`

---

## Need Help?

Common issues and solutions:
- Check PM2 logs: `pm2 logs`
- Verify Nginx config: `sudo nginx -t`
- Check firewall: `sudo ufw status`
- Test domain DNS: `dig your-domain.com`

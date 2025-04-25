#!/usr/bin/env bash
set -e

# --------------------------------------------------
# Deployment script for Ubuntu (no Docker)
# Place this script on your Ubuntu server and run:
#   chmod +x deploy.sh
#   ./deploy.sh
# --------------------------------------------------

# Configuration (customize these before running)
REPO_URL="https://github.com/alsubhan/movtracker"
BRANCH="prod"
APP_DIR="/var/www/movtracker"
# Server address and port
SERVER_IP=103.191.209.166
SERVER_PORT=4173

# Supabase environment
export VITE_SUPABASE_URL="https://supabase.tolor.com"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Install system packages
sudo apt-get update
sudo apt-get install -y git curl build-essential nginx nodejs npm

# Clone or update repository
if [ ! -d "$APP_DIR" ]; then
  sudo mkdir -p "$(dirname "$APP_DIR")"
  sudo git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR"
  sudo git fetch origin
  sudo git checkout "$BRANCH"
  sudo git reset --hard "origin/$BRANCH"
fi

cd "$APP_DIR"

# Generate environment file for build
cat > .env <<EOF
VITE_SUPABASE_URL="$VITE_SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY"
EOF

# Install Node dependencies and build
npm ci
npm run build

# Configure Nginx to serve the build
NGINX_CONF="/etc/nginx/sites-available/movtracker"
sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
    listen ${SERVER_PORT};
    server_name ${SERVER_IP};
    root $APP_DIR/dist;
    index index.html;
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Enable site and disable default
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/movtracker
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
# Enable Nginx to start on boot
sudo systemctl enable nginx

echo "Deployment to Ubuntu complete. Visit http://${SERVER_IP}:${SERVER_PORT} to verify."

#!/usr/bin/env bash
set -e

# --------------------------------------------------
# Supabase local setup script for Ubuntu
# Usage:
#   chmod +x supabase-setup.sh
#   ./supabase-setup.sh
# --------------------------------------------------

# Ensure Supabase CLI is installed
if ! command -v supabase >/dev/null 2>&1; then
  echo "Installing Supabase CLI..."
  curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get update
  sudo apt-get install -y pkg-config libssl-dev
  sudo npm install -g supabase
fi

# Link to project (ensure SUPABASE_PROJECT_REF env var or modify below)
# Uncomment and set your project ref if not already linked:
# supabase link --project-ref "$SUPABASE_PROJECT_REF"

# Start Supabase local stack in background
echo "Starting Supabase local stack..."
supabase start --no-telemetry &

# Wait for Postgres to be ready (optional)
echo "Waiting for database to initialize..."
sleep 10

# Reset database (drops & re-applies migrations)
echo "Resetting local database..."
supabase db reset --yes

echo "Supabase local setup complete. Services running on:"
echo "  Postgres:      localhost:5432"
echo "  REST API:      localhost:54321"
echo "  Realtime (WS): localhost:54322"

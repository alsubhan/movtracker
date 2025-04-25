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
  echo "Installing Supabase CLI via GitHub release..."
  # Download and install latest Supabase CLI
  # remove any stale binary or directory
  rm -rf supabase
  # download and extract
  curl -L "https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz" \
    | tar xz supabase
  sudo mv supabase /usr/local/bin/
fi

# Link to project (ensure SUPABASE_PROJECT_REF env var or modify below)
# Uncomment and set your project ref if not already linked:
# supabase link --project-ref "$SUPABASE_PROJECT_REF"
# Optionally link for remote, but remove project_id for pure local usage
# supabase link --project-ref "$SUPABASE_PROJECT_REF"

# Strip out any project_id from local config to avoid contacting remote
if [ -f "supabase/config.toml" ]; then
  sed -i '/^project_id/d' supabase/config.toml
fi

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

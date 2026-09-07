#!/usr/bin/env bash
# Startup script for Render deployment
set -e

echo "=== [SYSTEM] Starting Software Testing Resource Estimator ==="
echo "=== [SYSTEM] Checking Port: ${PORT:-5000} ==="

# Execute Gunicorn binding to Render dynamic port
exec gunicorn backend.app:app \
    --bind 0.0.0.0:"${PORT:-5000}" \
    --workers 2 \
    --threads 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -

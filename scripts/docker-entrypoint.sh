#!/bin/sh
set -e

echo "=== Samra Boutique Container Startup ==="

# Check if services are available and wait for them
echo "Checking external service connections..."
node scripts/wait-for-services.js

# Run service initialization (create schema, buckets, etc.)
echo "Initializing services..."
node scripts/init-services.js || echo "WARNING: Service initialization failed, but continuing startup"

# Start the Next.js application
echo "Starting Next.js application..."
exec npm start

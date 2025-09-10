# Samra Boutique Initialization Guide

This guide explains how to initialize and set up all required services for the Samra Boutique project before building and deploying.

## Prerequisites

- Node.js (v18 or later)
- Docker and Docker Compose
- Bash shell (Git Bash works for Windows)

## Available Scripts

### Initialize Services

To check and initialize all required services (PostgreSQL, Redis, MinIO, RabbitMQ):

```bash
npm run init:services
```

This script will:

1. Check database schema and apply it if missing
2. Create MinIO buckets if they don't exist
3. Test Redis connectivity
4. Set up RabbitMQ exchanges and queues

### Pre-build Setup (Recommended)

To perform a complete pre-build setup that includes checking for Docker containers and setting up environment:

```bash
npm run prebuild
```

This script will:

1. Check for a valid .env file and create one if missing
2. Verify Docker is installed and running
3. Check for required service containers and offer to create them
4. Run the service initialization script

### Docker Build with Initialization

To initialize services and then build the Docker image:

```bash
npm run docker:build
```

This will run the initialization script and then build the Docker image if initialization succeeds.

## Manual Setup

If you prefer manual setup, ensure you have the following services running:

1. **PostgreSQL** with the schema applied (schema.sql in the data directory)
2. **Redis** server
3. **MinIO** with a bucket created
4. **RabbitMQ** with required exchanges and queues

Then update your `.env` file with the correct connection details.

## Environment Variables

The following environment variables are required:

```
# PostgreSQL
DATABASE_URL=postgres://username:password@host:port/database

# Redis
REDIS_URL=redis://host:port

# RabbitMQ
RABBITMQ_URL=amqp://username:password@host:port

# MinIO
MINIO_ENDPOINT=host
MINIO_PORT=port
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=access_key
MINIO_SECRET_KEY=secret_key
MINIO_BUCKET_NAME=bucket_name
NEXT_PUBLIC_MINIO_ENDPOINT=host
NEXT_PUBLIC_MINIO_BUCKET_NAME=bucket_name
```

## Troubleshooting

If you encounter issues with the initialization:

1. Check that all services are running and accessible
2. Verify environment variables are correctly set in your `.env` file
3. Run `npm run init:services` to see specific error messages
4. Check service logs for more details:
   ```bash
   docker logs samra-postgres
   docker logs samra-redis
   docker logs samra-minio
   docker logs samra-rabbitmq
   ```

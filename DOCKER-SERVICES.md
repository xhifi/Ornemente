# Docker Services for Samra Boutique

This README provides instructions on how to use the Docker services for the Samra Boutique application.

## Services Included

- **PostgreSQL**: Database for storing application data
- **Redis**: In-memory data store for caching and session management
- **RabbitMQ**: Message broker for asynchronous processing
- **MinIO**: S3-compatible object storage for files and assets (accessed via AWS SDK)

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Node.js and npm/yarn

### Setup

1. **Install dependencies**:

```bash
npm install
```

2. **Start the Docker services**:

```bash
npm run docker:up
```

This will start all services defined in the `docker-compose.yml` file in detached mode.

3. **Initialize services**:

```bash
npm run init:services
```

This script will set up the MinIO bucket and ensure all services are properly connected.

4. **Run the application**:

```bash
npm run dev
```

### Service Access

- **PostgreSQL**: localhost:5432

  - Username: postgres (default)
  - Password: postgres (default)
  - Database: samra_db (default)

- **Redis**: localhost:6379

- **RabbitMQ**:

  - AMQP: localhost:5672
  - Management UI: http://localhost:15672
  - Username: guest (default)
  - Password: guest (default)

- **MinIO**:
  - API: http://localhost:9000
  - Console: http://localhost:9001
  - Username: minioadmin (default)
  - Password: minioadmin (default)

### Environment Variables

All service configuration is stored in the `.env` file. You can modify these variables to change service settings.

## Usage in the Application

The application includes utility files for connecting to each service:

- **PostgreSQL**: `lib/db.js`
- **Redis**: `lib/redis.js`
- **RabbitMQ**: `lib/rabbitmq.js`
- **MinIO**: `lib/minio.js`

Import these modules to use the respective services in your application.

## Stopping Services

To stop all Docker services:

```bash
npm run docker:down
```

## Data Persistence

All data is persisted in Docker volumes:

- `postgres_data`: PostgreSQL data
- `redis_data`: Redis data
- `rabbitmq_data`: RabbitMQ data
- `minio_data`: MinIO data

These volumes ensure your data is preserved even when containers are stopped or removed.

```
<div className="min-h-screen w-full bg-white relative">
  {/* Diagonal Stripes Background */}
  <div
    className="absolute inset-0 z-0"
    style={{
      backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, #f3f4f6 2px, #f3f4f6 4px)",
    }}
  />
     {/* Your Content/Components */}
</div>
```

#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}=== Samra Boutique Pre-build Setup ===${NC}"
echo -e "${BLUE}This script will check and prepare your environment before building the application.${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}Warning: .env file not found.${NC}"
  echo -e "Would you like to create a sample .env file? (y/n) "
  read answer
  
  if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
    cat > .env << EOL
# PostgreSQL
DATABASE_URL=postgres://postgres:postgres@localhost:5432/samra_boutique

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# MinIO - Server-side env vars
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=samra-boutique

# MinIO - Client-side env vars (with NEXT_PUBLIC prefix)
NEXT_PUBLIC_MINIO_ENDPOINT=localhost
NEXT_PUBLIC_MINIO_BUCKET_NAME=samra-boutique

# For auth setup
SETUP_TOKEN=setup-token-for-development-only

# Other configuration
NODE_ENV=development
EOL
    echo -e "${GREEN}Created sample .env file. Please update it with your actual configuration.${NC}"
  else
    echo -e "${RED}Error: .env file is required for building and running the application.${NC}"
    echo -e "Please create an .env file with the required environment variables and try again."
    exit 1
  fi
fi

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Error: Docker is not installed or not in PATH.${NC}"
  echo -e "Please install Docker and try again."
  exit 1
fi

docker_running=$(docker info &>/dev/null && echo "yes" || echo "no")
if [ "$docker_running" == "no" ]; then
  echo -e "${RED}Error: Docker daemon is not running.${NC}"
  echo -e "Please start Docker and try again."
  exit 1
fi

echo -e "${GREEN}✓ Docker is installed and running${NC}"

# Check if required services are running or can be started
echo -e "\n${BLUE}Checking for required services...${NC}"

# Function to check if a container is running
container_running() {
  docker ps --filter "name=$1" --format '{{.Names}}' | grep -q "$1"
  return $?
}

# Function to prompt for container creation
setup_container() {
  local container_name=$1
  local container_type=$2
  local default_port=$3
  
  echo -e "${YELLOW}$container_type container not found or not running.${NC}"
  echo -e "Would you like to create and start a $container_type container? (y/n) "
  read answer
  
  if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
    case "$container_type" in
      "PostgreSQL")
        echo -e "Setting up PostgreSQL container..."
        docker run -d --name $container_name \
          -e POSTGRES_PASSWORD=postgres \
          -e POSTGRES_USER=postgres \
          -e POSTGRES_DB=samra_boutique \
          -p $default_port:5432 \
          postgres:14
        ;;
      "Redis")
        echo -e "Setting up Redis container..."
        docker run -d --name $container_name \
          -p $default_port:6379 \
          redis:7
        ;;
      "RabbitMQ")
        echo -e "Setting up RabbitMQ container..."
        docker run -d --name $container_name \
          -p $default_port:5672 \
          -p 15672:15672 \
          rabbitmq:3-management
        ;;
      "MinIO")
        echo -e "Setting up MinIO container..."
        docker run -d --name $container_name \
          -p $default_port:9000 \
          -p 9001:9001 \
          -e MINIO_ROOT_USER=minioadmin \
          -e MINIO_ROOT_PASSWORD=minioadmin \
          quay.io/minio/minio server /data --console-address ":9001"
        ;;
    esac
    
    echo -e "Waiting for $container_type container to start..."
    sleep 5
    
    if container_running "$container_name"; then
      echo -e "${GREEN}✓ $container_type container started successfully${NC}"
      return 0
    else
      echo -e "${RED}Error: Failed to start $container_type container.${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}Skipping $container_type setup. Make sure it's running before building the application.${NC}"
    return 1
  fi
}

# Check PostgreSQL
if ! container_running "samra-postgres"; then
  setup_container "samra-postgres" "PostgreSQL" "5432" || echo -e "${YELLOW}⚠️ PostgreSQL not configured. Update your .env file accordingly.${NC}"
else
  echo -e "${GREEN}✓ PostgreSQL container is running${NC}"
fi

# Check Redis
if ! container_running "samra-redis"; then
  setup_container "samra-redis" "Redis" "6379" || echo -e "${YELLOW}⚠️ Redis not configured. Update your .env file accordingly.${NC}"
else
  echo -e "${GREEN}✓ Redis container is running${NC}"
fi

# Check RabbitMQ
if ! container_running "samra-rabbitmq"; then
  setup_container "samra-rabbitmq" "RabbitMQ" "5672" || echo -e "${YELLOW}⚠️ RabbitMQ not configured. Update your .env file accordingly.${NC}"
else
  echo -e "${GREEN}✓ RabbitMQ container is running${NC}"
fi

# Check MinIO
if ! container_running "samra-minio"; then
  setup_container "samra-minio" "MinIO" "9000" || echo -e "${YELLOW}⚠️ MinIO not configured. Update your .env file accordingly.${NC}"
else
  echo -e "${GREEN}✓ MinIO container is running${NC}"
fi

# Run the initialization script
echo -e "\n${BLUE}Running service initialization script...${NC}"
node scripts/init-services.js

# Check if init script succeeded
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}Pre-build setup completed successfully.${NC}"
  echo -e "${GREEN}You can now build your Docker image with:${NC}"
  echo -e "  docker build -t samra-boutique ."
  echo -e "${GREEN}Or run the development server with:${NC}"
  echo -e "  npm run dev"
else
  echo -e "\n${RED}Pre-build setup encountered errors.${NC}"
  echo -e "Please fix the issues above before building the application."
  exit 1
fi

"use strict";

require("dotenv").config();
const { Client } = require("pg");
const Redis = require("ioredis");
const amqplib = require("amqplib");
const { S3Client, HeadBucketCommand } = require("@aws-sdk/client-s3");

// Define colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

console.log(`${colors.magenta}=== Service Connection Check ====${colors.reset}`);

// Sleep function to wait between retry attempts
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Generic connection check with retry
async function checkConnection(name, checkFn, maxRetries = 10, retryDelay = 3000) {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`${colors.blue}Checking ${name} connection... (attempt ${retries + 1}/${maxRetries})${colors.reset}`);
      await checkFn();
      console.log(`${colors.green}✓ Connected to ${name}${colors.reset}`);
      return true;
    } catch (error) {
      console.log(`${colors.yellow}! Failed to connect to ${name}: ${error.message}${colors.reset}`);

      if (retries === maxRetries - 1) {
        console.log(`${colors.red}Maximum retries reached for ${name}. Proceeding anyway.${colors.reset}`);
        return false;
      }

      console.log(`${colors.yellow}Retrying in ${retryDelay / 1000} seconds...${colors.reset}`);
      await sleep(retryDelay);
      retries++;
    }
  }

  return false;
}

// Check PostgreSQL connection
const checkPostgres = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    const { rows } = await client.query("SELECT NOW()");
    await client.end();
  } catch (error) {
    throw error;
  }
};

// Check Redis connection
const checkRedis = async () => {
  const redis = new Redis(process.env.REDIS_URL, {
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
  });

  try {
    await redis.ping();
    redis.disconnect();
  } catch (error) {
    redis.disconnect();
    throw error;
  }
};

// Check RabbitMQ connection
const checkRabbitMQ = async () => {
  try {
    const connection = await amqplib.connect(process.env.RABBITMQ_URL);
    await connection.close();
  } catch (error) {
    throw error;
  }
};

// Check MinIO connection
const checkMinIO = async () => {
  const s3Client = new S3Client({
    endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
    region: "us-east-1", // MinIO default region
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY,
      secretAccessKey: process.env.MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
  });

  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: process.env.MINIO_BUCKET_NAME }));
  } catch (error) {
    throw error;
  }
};

// Check all connections
async function checkAllConnections() {
  const results = {
    postgres: false,
    redis: false,
    rabbitmq: false,
    minio: false,
  };

  results.postgres = await checkConnection("PostgreSQL", checkPostgres);
  results.redis = await checkConnection("Redis", checkRedis);
  results.rabbitmq = await checkConnection("RabbitMQ", checkRabbitMQ);
  results.minio = await checkConnection("MinIO", checkMinIO);

  const allConnected = Object.values(results).every(Boolean);
  const summary = Object.entries(results)
    .map(([service, connected]) => `${connected ? "✓" : "✗"} ${service}`)
    .join(", ");

  console.log(`\n${colors.magenta}=== Connection Summary ===${colors.reset}`);
  console.log(`${colors.blue}${summary}${colors.reset}`);

  if (allConnected) {
    console.log(`${colors.green}All services are connected and ready!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Warning: Not all services are available. The application may have limited functionality.${colors.reset}`);
  }

  return allConnected;
}

// Main function
async function main() {
  try {
    await checkAllConnections();
  } catch (error) {
    console.log(`${colors.red}Error checking connections: ${error.message}${colors.reset}`);
  }
}

// Run the checks
if (require.main === module) {
  main();
}

module.exports = {
  checkAllConnections,
  checkConnection,
};

"use strict";

require("dotenv").config();
const { Client } = require("pg");
const Redis = require("ioredis");
const amqplib = require("amqplib");
const { S3Client, CreateBucketCommand, HeadBucketCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

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

console.log(`${colors.magenta}=== Samra Boutique Initialization Script ===${colors.reset}`);
console.log(`${colors.cyan}Checking and initializing required services...${colors.reset}\n`);

// Configuration validation
const validateConfig = () => {
  console.log(`${colors.blue}Validating configuration...${colors.reset}`);
  const requiredVars = [
    "DATABASE_URL",
    "MINIO_ENDPOINT",
    "MINIO_PORT",
    "MINIO_ACCESS_KEY",
    "MINIO_SECRET_KEY",
    "MINIO_BUCKET_NAME",
    "REDIS_URL",
    "RABBITMQ_URL",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.log(`${colors.red}Error: Missing required environment variables: ${missingVars.join(", ")}${colors.reset}`);
    console.log(`${colors.yellow}Please add these variables to your .env file and try again.${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}✓ Configuration validated${colors.reset}\n`);
};

// PostgreSQL initialization
const initializePostgres = async () => {
  console.log(`${colors.blue}Setting up PostgreSQL...${colors.reset}`);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log(`${colors.green}✓ Connected to PostgreSQL${colors.reset}`);

    // Check if the database schema has been initialized
    const { rows } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `);

    if (!rows[0].exists) {
      console.log(`${colors.yellow}! Database schema not initialized, applying schema.sql...${colors.reset}`);

      const schemaPath = path.join(__dirname, "..", "data", "schema.sql");
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, "utf8");
        await client.query(schemaSql);
        console.log(`${colors.green}✓ Schema applied successfully${colors.reset}`);
      } else {
        console.log(`${colors.red}Error: schema.sql file not found at ${schemaPath}${colors.reset}`);
        console.log(`${colors.yellow}Please ensure the schema file exists and try again.${colors.reset}`);
      }
    } else {
      console.log(`${colors.green}✓ Database schema already initialized${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}Error connecting to PostgreSQL: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Please check your DATABASE_URL and make sure PostgreSQL is running.${colors.reset}`);
  } finally {
    await client.end();
  }
  console.log("");
};

// MinIO initialization
const initializeMinio = async () => {
  console.log(`${colors.blue}Setting up MinIO...${colors.reset}`);

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
    // Check if bucket exists
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: process.env.MINIO_BUCKET_NAME }));
      console.log(`${colors.green}✓ MinIO bucket '${process.env.MINIO_BUCKET_NAME}' already exists${colors.reset}`);
    } catch (error) {
      if (error.name === "NoSuchBucket" || error.name === "NotFound") {
        console.log(`${colors.yellow}! MinIO bucket '${process.env.MINIO_BUCKET_NAME}' not found, creating...${colors.reset}`);
        await s3Client.send(new CreateBucketCommand({ Bucket: process.env.MINIO_BUCKET_NAME }));
        console.log(`${colors.green}✓ MinIO bucket '${process.env.MINIO_BUCKET_NAME}' created successfully${colors.reset}`);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.log(`${colors.red}Error setting up MinIO: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Please check your MinIO configuration and make sure MinIO is running.${colors.reset}`);
  }
  console.log("");
};

// Redis initialization
const initializeRedis = async () => {
  console.log(`${colors.blue}Checking Redis connection...${colors.reset}`);

  const redis = new Redis(process.env.REDIS_URL);

  try {
    // Test Redis connection
    await redis.ping();
    console.log(`${colors.green}✓ Connected to Redis${colors.reset}`);

    // Set a test key-value pair
    await redis.set("init_test", "Samra Boutique Initialization");
    const testValue = await redis.get("init_test");

    if (testValue === "Samra Boutique Initialization") {
      console.log(`${colors.green}✓ Redis read/write test passed${colors.reset}`);
    } else {
      console.log(`${colors.yellow}! Redis read/write test failed${colors.reset}`);
    }

    await redis.del("init_test");
  } catch (error) {
    console.log(`${colors.red}Error connecting to Redis: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Please check your REDIS_URL and make sure Redis is running.${colors.reset}`);
  } finally {
    redis.disconnect();
  }
  console.log("");
};

// RabbitMQ initialization
const initializeRabbitMQ = async () => {
  console.log(`${colors.blue}Setting up RabbitMQ...${colors.reset}`);

  try {
    const connection = await amqplib.connect(process.env.RABBITMQ_URL);
    console.log(`${colors.green}✓ Connected to RabbitMQ${colors.reset}`);

    const channel = await connection.createChannel();

    // Define exchange and queues based on your application needs
    const exchangeName = "samra_events";
    await channel.assertExchange(exchangeName, "topic", { durable: true });
    console.log(`${colors.green}✓ Exchange '${exchangeName}' created/verified${colors.reset}`);

    // Setup common queues for the application
    const queues = [
      { name: "order_processing", routingKey: "order.#" },
      { name: "email_notifications", routingKey: "notification.email.#" },
      { name: "inventory_updates", routingKey: "inventory.#" },
    ];

    for (const queue of queues) {
      await channel.assertQueue(queue.name, { durable: true });
      await channel.bindQueue(queue.name, exchangeName, queue.routingKey);
      console.log(`${colors.green}✓ Queue '${queue.name}' created/verified and bound to exchange${colors.reset}`);
    }

    await channel.close();
    await connection.close();
  } catch (error) {
    console.log(`${colors.red}Error setting up RabbitMQ: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Please check your RABBITMQ_URL and make sure RabbitMQ is running.${colors.reset}`);
  }
  console.log("");
};

// Run all initialization processes
const initialize = async () => {
  try {
    validateConfig();
    await initializePostgres();
    await initializeMinio();
    await initializeRedis();
    await initializeRabbitMQ();

    console.log(`${colors.magenta}=== Initialization Complete ===${colors.reset}`);
    console.log(`${colors.green}All required services have been checked and initialized.${colors.reset}`);
    console.log(`${colors.green}Your Samra Boutique application is ready to build and run!${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}Initialization failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
};

// Run the initialization
initialize();

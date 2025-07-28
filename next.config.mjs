/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatar.iran.liara.run",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
  env: {
    // PostgreSQL
    DATABASE_URL: process.env.DATABASE_URL,

    // Redis
    REDIS_URL: process.env.REDIS_URL,

    // RabbitMQ
    RABBITMQ_URL: process.env.RABBITMQ_URL,

    // MinIO - Server-side env vars
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
    MINIO_PORT: process.env.MINIO_PORT,
    MINIO_USE_SSL: process.env.MINIO_USE_SSL,
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,

    // MinIO - Client-side env vars (with NEXT_PUBLIC prefix)
    NEXT_PUBLIC_MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
    NEXT_PUBLIC_MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,
  },
};

export default nextConfig;

import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Extract endpoint from environment variable or use default
const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
const bucketName = process.env.MINIO_BUCKET_NAME || "samraz-boutique";

// Configure S3 client to connect to MinIO
const s3Client = new S3Client({
  endpoint: endpoint,
  region: "us-east-1", // MinIO doesn't require a specific region, but AWS SDK requires one
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
  forcePathStyle: true, // Required for MinIO
});

export async function GET(request, { params }) {
  // Get the URL from the request
  const url = new URL(request.url);
  // Extract path from the URL pathname
  const pathParts = url.pathname.split("/api/images/");
  // The path is everything after "/api/images/"
  const encodedPath = pathParts[1] || "";
  // Decode the URL-encoded path
  const path = decodeURIComponent(encodedPath);

  try {
    // Log what we're trying to fetch for debugging
    console.log(`Fetching image from MinIO: bucket=${bucketName}, key=${path}`);

    // Create GetObject command
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: path,
    });

    // Get the object from MinIO
    const { Body, ContentType } = await s3Client.send(command);

    // Create response stream
    if (!Body) {
      throw new Error("No body returned from MinIO");
    }

    // Convert readable stream to buffer
    const chunks = [];
    for await (const chunk of Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Create and return the response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": ContentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
      },
    });
  } catch (error) {
    console.error(`Error fetching image from MinIO: bucket=${bucketName}, key=${path}`, error);

    // Check if error is NoSuchKey
    const isNoSuchKey = error.name === "NoSuchKey" || error.Code === "NoSuchKey" || (error.message && error.message.includes("NoSuchKey"));

    // Return a more detailed error for debugging
    return new NextResponse(
      JSON.stringify({
        error: error.message,
        bucket: bucketName,
        key: path,
        endpoint: endpoint,
        notFound: isNoSuchKey,
      }),
      {
        status: isNoSuchKey ? 404 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

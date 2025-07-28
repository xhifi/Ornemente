import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

// Initialize bucket if it doesn't exist
export async function initializeBucket() {
  try {
    // Check if bucket exists
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      console.log(`Bucket '${bucketName}' already exists`);
    } catch (error) {
      // If bucket doesn't exist, create it
      if (error.name === "NotFound" || error.name === "NoSuchBucket" || error.$metadata?.httpStatusCode === 404) {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`Bucket '${bucketName}' created successfully`);

        // Set bucket policy to allow public read access
        // This is required since we're accessing files directly from the browser
        const policy = {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        };

        await s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: JSON.stringify(policy),
          })
        );
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Error initializing S3 bucket:", error);
    throw error;
  }
}

// Upload a file to S3/MinIO
export async function uploadFile(fileBuffer, fileName, contentType) {
  try {
    console.log(`[MINIO] Uploading file to bucket: '${bucketName}', key: '${fileName}'`);

    // Deep debugging
    console.log(`[MINIO] Environment variables:`, {
      MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || "NOT SET (using default)",
      MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY ? "SET" : "NOT SET (using default)",
      MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY ? "SET" : "NOT SET (using default)",
      MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME || "NOT SET (using default)",
    });

    console.log(`[MINIO] File details:`, {
      bufferProvided: !!fileBuffer,
      bufferLength: fileBuffer ? fileBuffer.length : 0,
      isBuffer: Buffer.isBuffer(fileBuffer),
      fileName,
      contentType,
      timestamp: new Date().toISOString(),
    });

    console.log(`[MINIO] S3 client config:`, {
      endpoint: s3Client.config.endpoint,
      region: s3Client.config.region,
      forcePathStyle: s3Client.config.forcePathStyle,
      credentialsProvided: !!s3Client.config.credentials,
    });

    // Make sure bucket exists before uploading
    let bucketExists = false;
    try {
      await initializeBucket();
      console.log(`[MINIO] Bucket initialization completed`);

      // Explicitly verify bucket exists
      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        bucketExists = true;
        console.log(`[MINIO] Bucket '${bucketName}' confirmed to exist`);
      } catch (headError) {
        console.error(`[MINIO] Error checking if bucket exists:`, headError);
        throw new Error(`Bucket '${bucketName}' does not exist or cannot be accessed: ${headError.message}`);
      }
    } catch (bucketError) {
      console.error(`[MINIO] Error initializing bucket before upload:`, bucketError);
      throw bucketError; // Don't continue if we can't access the bucket
    }

    // Verify the input
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("Empty file buffer provided for upload");
    }

    if (!fileName) {
      throw new Error("No file name provided for upload");
    }

    console.log(`[MINIO] Creating PutObjectCommand with bucket: ${bucketName}, key: ${fileName}`);
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType || "application/octet-stream",
    });

    // Deep debugging - inspect the command
    console.log(`[MINIO] PutObjectCommand details:`, {
      bucket: command.input.Bucket,
      key: command.input.Key,
      contentType: command.input.ContentType,
      bodyType: typeof command.input.Body,
      bodyIsBuffer: Buffer.isBuffer(command.input.Body),
      bodyLength: Buffer.isBuffer(command.input.Body) ? command.input.Body.length : "unknown",
    });

    console.log(`[MINIO] Sending command to S3 client...`);
    let result;
    try {
      result = await s3Client.send(command);
      console.log(`[MINIO] Upload successful to bucket: ${bucketName}, result:`, result);
    } catch (uploadError) {
      console.error(`[MINIO] Upload failed with error:`, uploadError);

      // Check for common errors and provide more helpful messages
      if (uploadError.name === "NoSuchBucket") {
        throw new Error(`Bucket '${bucketName}' does not exist. Please create it first.`);
      } else if (uploadError.name === "AccessDenied") {
        throw new Error(`Access denied to bucket '${bucketName}'. Check your credentials and bucket permissions.`);
      } else {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
    }

    // Get the direct URL of the uploaded file from MinIO
    const minioEndpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
    const fileUrl = `${minioEndpoint}/${bucketName}/${fileName}`;
    console.log(`[MINIO] Generated direct MinIO URL: ${fileUrl}`);

    // Verify the upload worked by trying to HEAD the object
    let verified = false;
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });
      const headResult = await s3Client.send(headCommand);
      verified = true;
      console.log(`[MINIO] Verified upload exists with content type: ${headResult.ContentType}`);
    } catch (verifyError) {
      console.error(`[MINIO] Warning: Could not verify uploaded file exists:`, verifyError);
      // We'll log this but still return success if the PUT operation succeeded
    }

    return {
      success: true,
      url: fileUrl,
      key: fileName,
      contentType: contentType,
      verified: verified,
      eTag: result?.ETag,
    };
  } catch (error) {
    console.error("Error uploading file to S3/MinIO:", error);
    return {
      success: false,
      error: error.message || "Unknown error during file upload",
      errorCode: error.code,
      errorName: error.name,
      stack: error.stack,
    };
  }
}

// Get a presigned URL for object download
export async function getPresignedUrl(objectName, expiryInSeconds = 604800) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectName,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiryInSeconds,
    });

    return presignedUrl;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw error;
  }
}

// Delete an object from S3/MinIO
export async function deleteFile(objectName) {
  try {
    console.log(`[MINIO] Deleting file from bucket: '${bucketName}', key: '${objectName}'`);

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectName,
    });

    const result = await s3Client.send(command);
    if (!result.$metadata.httpStatusCode || result.$metadata.httpStatusCode !== 204) {
      throw new Error(`Failed to delete file: ${objectName}`);
    }
    console.log(`[MINIO] Successfully deleted file: ${objectName}`);

    return {
      success: true,
      message: `File ${objectName} deleted successfully`,
    };
  } catch (error) {
    console.error("Error deleting file from S3/MinIO:", error);
    throw error;
  }
}

// List objects in a bucket with optional prefix filter
export async function listFiles(prefix = "") {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error("Error listing files from S3/MinIO:", error);
    throw error;
  }
}

export default {
  client: s3Client,
  bucketName,
  initializeBucket,
  uploadFile,
  getPresignedUrl,
  deleteFile,
  listFiles,
};

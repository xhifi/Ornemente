import { NextResponse } from "next/server";
import { Readable } from "stream";
import minio from "@/lib/minio";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const { client, bucketName } = minio;

/**
 * Convert a readable stream to a Response
 * @param {Readable} stream - The stream to convert
 * @param {string} contentType - The content type of the response
 * @returns {Response} - A Response object that can be returned from a Next.js API route
 */
async function streamToResponse(stream, contentType) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  // Set appropriate cache settings based on content type
  let cacheControl;

  if (contentType.startsWith("image/")) {
    // Cache images for longer (7 days) as they rarely change once uploaded
    cacheControl = "public, max-age=604800, stale-while-revalidate=86400";
  } else {
    // Other content types cache for 24 hours
    cacheControl = "public, max-age=86400, stale-while-revalidate=3600";
  }

  return new Response(Buffer.concat(chunks), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      ETag: `"${Buffer.concat(chunks).length.toString(16)}"`, // Simple ETag generation
      "Accept-Ranges": "bytes", // Enable partial content requests
    },
  });
}

/**
 * Determine content type based on file extension
 * @param {string} path - The file path
 * @returns {string} - The content type
 */
function getContentType(path) {
  const extension = path.split(".").pop().toLowerCase();
  const contentTypeMap = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    avif: "image/avif",
    bmp: "image/bmp",
    ico: "image/x-icon",
    tiff: "image/tiff",
    tif: "image/tiff",

    // Documents - in case you need to serve other files in the future
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // Compressed files
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",

    // Text files
    txt: "text/plain",
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    xml: "application/xml",
    csv: "text/csv",
  };

  return contentTypeMap[extension] || "application/octet-stream";
}

/**
 * GET handler for proxying MinIO images
 * @param {Request} request - The incoming request
 * @param {Object} context - The context containing path parameters
 * @returns {Response} - The image response
 */
export async function GET(request, { params }) {
  try {
    const { path } = await params;

    // If no path is provided, return 404
    if (!path || path.length === 0) {
      return NextResponse.json({ error: "Image path is required" }, { status: 404 });
    }

    // Construct the S3 object key from the path segments
    const objectKey = Array.isArray(path) ? path.join("/") : path;

    // Log the request with bucket information for debugging
    console.log(`[CDN] Requested image: ${objectKey} from bucket: ${bucketName}`);

    // Set up parameters for GetObject operation
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    try {
      // Get the object from MinIO using the existing client
      const response = await client.send(command);

      // Determine the content type
      const contentType = response.ContentType || getContentType(objectKey);

      // Convert the stream to a Response and return it
      return streamToResponse(response.Body, contentType);
    } catch (error) {
      if (error.$metadata?.httpStatusCode === 404 || error.name === "NoSuchKey") {
        console.error(`[CDN] Image not found: ${objectKey}`);
        return NextResponse.json({ error: "Image not found", path: objectKey }, { status: 404 });
      }

      console.error(`[CDN] Error getting object from MinIO:`, error);
      return NextResponse.json(
        {
          error: "Failed to retrieve image",
          details: error.message,
          path: objectKey,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[CDN] Error in image proxy API route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

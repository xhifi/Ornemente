"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { uploadFile, deleteFile as deleteMinioFile } from "@/lib/minio";

/**
 * Save image records to the database
 *
 * @param {Object} data - Product ID and images array
 * @returns {Promise<Object>} - Result with saved image data or error
 */
export async function saveImages({ product_id, images, created_by }) {
  console.log(`SAVE IMAGES CALLED with product_id: ${product_id}, images count: ${images?.length || "undefined"}`);
  console.log(`Function environment:`, {
    isServer: typeof window === "undefined",
    timestamp: new Date().toISOString(),
  });

  try {
    // Validate required fields
    if (!product_id || !images || !Array.isArray(images)) {
      console.error("Missing required fields:", { product_id, imagesProvided: !!images, isArray: Array.isArray(images) });
      return { error: "Missing required fields: product_id and images array" };
    }

    // Prepare results array to track success/failure of each image
    const results = [];

    // Process each image
    for (const image of images) {
      try {
        // Handle different types of image inputs
        let imagePath = image.path;
        let imageKey = image.key;
        let storageResult = null;

        // If we have a base64 image or file object, upload to storage first
        if (image.base64 && image.base64.startsWith("data:image/") && !image.path) {
          try {
            // Extract mime type and base64 data
            const matches = image.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

            if (!matches || matches.length !== 3) {
              throw new Error("Invalid base64 string format");
            }

            const mimeType = matches[1];
            const base64Data = matches[2];

            console.log(`[IMAGE-ACTIONS] Base64 data extracted, length: ${base64Data.length}, mime type: ${mimeType}`);

            try {
              const buffer = Buffer.from(base64Data, "base64");
              console.log(
                `[IMAGE-ACTIONS] Created buffer from base64, buffer length: ${buffer.length}, is Buffer: ${Buffer.isBuffer(buffer)}`
              );

              // Generate unique file path for storage using timestamp and random string
              const timestamp = Date.now();
              const randomStr = Math.random().toString(36).substring(2, 10);
              const fileName = image.name || `product_${product_id}_${timestamp}_${randomStr}`;
              const extension = mimeType.split("/")[1] || "jpg";
              const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_"); // Sanitize filename

              // Create a folder structure: products/[product_id]/[filename].[ext]
              const filePath = `products/${product_id}/${safeFileName}.${extension}`;
              console.log(`[IMAGE-ACTIONS] Generated file path for upload: ${filePath}`);

              // Upload to storage
              console.log(`[IMAGE-ACTIONS] Calling uploadFile with buffer length: ${buffer.length}`);
              storageResult = await uploadFile(buffer, filePath, mimeType);
              console.log(`---STORAGE UPLOAD RESULT---`, storageResult);

              if (!storageResult.success) {
                console.error(`[IMAGE-ACTIONS] Storage upload failed:`, storageResult.error);
                throw new Error(storageResult.error || "Failed to upload to storage");
              }

              // Update path and key for database storage
              imagePath = storageResult.key;
              imageKey = storageResult.key;

              console.log(`[IMAGE-ACTIONS] Successfully uploaded image to storage: ${imagePath}`);
            } catch (bufferError) {
              console.error("[IMAGE-ACTIONS] Error creating buffer from base64:", bufferError);
              throw new Error(`Buffer creation failed: ${bufferError.message}`);
            }
          } catch (uploadError) {
            console.error("[IMAGE-ACTIONS] Error uploading image to storage:", uploadError);
            results.push({
              success: false,
              image: image,
              error: `Storage upload failed: ${uploadError.message}`,
            });
            continue;
          }
        }

        // Required fields check after possible upload
        if (!imagePath || !imageKey) {
          results.push({
            success: false,
            image: image,
            error: "Missing required image fields: path and key",
          });
          continue;
        }

        // Insert image record
        const result = await query(
          `INSERT INTO shop_images (
            product_id, 
            path, 
            key, 
            name, 
            selected, 
            position, 
            mime_type, 
            size,
            width,
            height,
            created_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          ) RETURNING *`,
          [
            product_id,
            imagePath, // Use the updated path from storage upload if available
            imageKey, // Use the updated key from storage upload if available
            image.name || (imagePath ? imagePath.split("/").pop() : null),
            image.selected !== undefined ? image.selected : true, // Default to selected
            image.position || 0,
            image.mime_type || storageResult?.contentType || null,
            image.size || storageResult?.size || null,
            image.width || null,
            image.height || null,
            created_by || null,
          ]
        );

        results.push({
          success: true,
          image: result.rows[0],
        });
      } catch (error) {
        console.error("Error saving image:", error);
        results.push({
          success: false,
          image: image,
          error: error.message || "Error saving image",
        });
      }
    }

    // Revalidate the cache for the product
    revalidateTag("product");

    return {
      success: results.some((r) => r.success), // At least one success
      results: results,
    };
  } catch (error) {
    console.error("Error in saveImages:", error);
    return { error: error.message || "Unknown error processing images" };
  }
}

/**
 * Get images for a product
 *
 * @param {number} productId - Product ID to get images for
 * @returns {Promise<Object>} - Result with images or error
 */
export async function getProductImages(productId) {
  try {
    if (!productId) {
      return { error: "Product ID is required" };
    }

    // Get images from database
    const result = await query("SELECT * FROM shop_images WHERE product_id = $1 ORDER BY position", [productId]);

    // Enhance image objects with full URLs
    const images = result.rows.map((img) => {
      // Add full URL if not present
      if (img.path && !img.url) {
        // Use direct MinIO URL
        const minioEndpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
        const minioBucket = process.env.MINIO_BUCKET_NAME || "samraz-boutique";
        img.url = `${minioEndpoint}/${minioBucket}/${img.path}`;
        console.log(`Generated direct MinIO URL: ${img.url}`);
      }
      return img;
    });

    return {
      success: true,
      images: images,
    };
  } catch (error) {
    console.error("Error getting product images:", error);
    return { error: error.message || "Unknown database error" };
  }
}

/**
 * Delete an image by ID
 *
 * @param {number} imageId - Image ID to delete
 * @returns {Promise<Object>} - Success message or error
 */
export async function deleteImage(imageId) {
  try {
    if (!imageId) {
      return { error: "Image ID is required" };
    }

    // Get the image record first to obtain file key for storage deletion
    const imageResult = await query("SELECT id, product_id, path, key FROM shop_images WHERE id = $1", [imageId]);

    if (imageResult.rowCount === 0) {
      return { error: "Image not found" };
    }

    const image = imageResult.rows[0];
    const product_id = image.product_id;
    const imageKey = image.key;

    // Delete the image from storage if key exists
    if (imageKey) {
      try {
        await deleteMinioFile(imageKey);
        console.log(`Deleted image from storage: ${imageKey}`);
      } catch (storageError) {
        console.error(`Failed to delete image from storage: ${imageKey}`, storageError);
        // We continue with database deletion even if storage deletion fails
        // This prevents orphaned database records
      }
    }

    // Delete the image record from database
    const result = await query("DELETE FROM shop_images WHERE id = $1", [imageId]);

    if (result.rowCount === 0) {
      return { error: "Failed to delete image record" };
    }

    // Revalidate the cache
    revalidateTag("product");

    return {
      success: true,
      message: "Image deleted successfully from database and storage",
    };
  } catch (error) {
    console.error("Error deleting image:", error);
    return { error: error.message || "Unknown database error" };
  }
}

/**
 * Update images for a product (add, update, delete operations in one call)
 *
 * @param {Object} params - Operation parameters
 * @param {number} params.product_id - Product ID
 * @param {Array} params.addImages - New images to add
 * @param {Array} params.updateImages - Existing images to update
 * @param {Array} params.deleteImages - Image IDs to delete
 * @param {string|number} params.updated_by - User ID who made the changes
 * @returns {Promise<Object>} - Operation results
 */
export async function updateProductImages({ product_id, addImages = [], updateImages = [], deleteImages = [], updated_by }) {
  try {
    // Validate required fields
    if (!product_id) {
      return { error: "Product ID is required" };
    }

    const results = {
      added: [],
      updated: [],
      deleted: [],
      errors: [],
    };

    // Begin transaction
    await query("BEGIN");

    try {
      // 1. Handle deletions first
      if (deleteImages && deleteImages.length > 0) {
        for (const imageId of deleteImages) {
          try {
            // Get image info to delete from storage
            const imageResult = await query("SELECT key FROM shop_images WHERE id = $1", [imageId]);

            if (imageResult.rowCount > 0) {
              const imageKey = imageResult.rows[0].key;

              // Delete from storage first
              if (imageKey) {
                try {
                  await deleteMinioFile(imageKey);
                } catch (storageError) {
                  console.error(`Failed to delete image from storage: ${imageKey}`, storageError);
                  // Continue with DB deletion even if storage deletion fails
                }
              }

              // Delete from database
              await query("DELETE FROM shop_images WHERE id = $1", [imageId]);
              results.deleted.push({ id: imageId, success: true });
            } else {
              results.errors.push({ id: imageId, error: "Image not found" });
            }
          } catch (error) {
            results.errors.push({ id: imageId, error: error.message });
          }
        }
      }

      // 2. Handle updates
      if (updateImages && updateImages.length > 0) {
        for (const image of updateImages) {
          try {
            if (!image.id) {
              results.errors.push({ image: image, error: "Image ID is required for updates" });
              continue;
            }

            // Update image record
            await query(
              `UPDATE shop_images SET
               selected = $1,
               position = $2,
               updated_by = $3,
               updated_at = NOW()
               WHERE id = $4 AND product_id = $5`,
              [image.selected !== undefined ? image.selected : true, image.position || 0, updated_by || null, image.id, product_id]
            );

            results.updated.push({ id: image.id, success: true });
          } catch (error) {
            results.errors.push({ id: image.id, error: error.message });
          }
        }
      }

      // 3. Handle new images
      if (addImages && addImages.length > 0) {
        // Use the existing saveImages function
        const saveResult = await saveImages({
          product_id,
          images: addImages,
          created_by: updated_by,
        });

        if (saveResult.success) {
          results.added = saveResult.results.filter((r) => r.success).map((r) => r.image);
        }

        // Add any errors
        const errors = saveResult.results.filter((r) => !r.success).map((r) => ({ image: r.image, error: r.error }));

        if (errors.length > 0) {
          results.errors.push(...errors);
        }
      }

      // Commit transaction
      await query("COMMIT");

      // Revalidate the cache
      revalidateTag("product");

      return {
        success: true,
        results,
      };
    } catch (error) {
      // Rollback on error
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error in updateProductImages:", error);
    return {
      success: false,
      error: error.message || "Unknown error updating product images",
    };
  }
}

/**
 * Update image positions
 *
 * @param {Array} images - Array of image objects with id and position
 * @returns {Promise<Object>} - Success message or error
 */
export async function updateImagePositions(images) {
  try {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return { error: "Images array is required" };
    }

    // Begin transaction
    await query("BEGIN");

    try {
      // Update each image position
      for (const image of images) {
        if (!image.id || image.position === undefined) {
          throw new Error("Each image must have id and position");
        }

        await query("UPDATE shop_images SET position = $1 WHERE id = $2", [image.position, image.id]);
      }

      // Commit transaction
      await query("COMMIT");

      // Get product_id from first image for revalidation
      const productResult = await query("SELECT product_id FROM shop_images WHERE id = $1", [images[0].id]);

      if (productResult.rowCount > 0) {
        // Revalidate the cache
        revalidateTag("product");
      }

      return {
        success: true,
        message: "Image positions updated successfully",
      };
    } catch (error) {
      // Rollback on error
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error updating image positions:", error);
    return { error: error.message || "Unknown database error" };
  }
}

/**
 * Upload images directly to storage and save records to database
 * Optimized for direct file uploads from the browser
 *
 * @param {Object} params - Upload parameters
 * @param {number} params.product_id - Product ID
 * @param {Array} params.files - Array of File objects from browser form
 * @param {Object} params.metadata - Additional metadata to save (optional)
 * @param {string|number} params.created_by - User ID who uploaded the images
 * @returns {Promise<Object>} - Upload results
 */
export async function uploadProductImages({ product_id, files, metadata = {}, created_by }) {
  try {
    // Validate required fields
    if (!product_id || !files || !Array.isArray(files) || files.length === 0) {
      return { error: "Missing required fields: product_id and files array" };
    }

    const results = [];

    // Get product info for folder structure
    const productResult = await query("SELECT name, sex FROM shop_products WHERE id = $1", [product_id]);

    if (productResult.rowCount === 0) {
      return { error: "Product not found" };
    }

    const product = productResult.rows[0];

    // Process each file
    for (const file of files) {
      try {
        // Skip invalid files
        if (!file || !file.buffer || !file.mimetype) {
          results.push({
            success: false,
            file: file?.originalname || "Unknown file",
            error: "Invalid file object",
          });
          continue;
        }

        // Generate file path using product info and timestamp for uniqueness
        const timestamp = Date.now();
        const fileName = file.originalname || `product_${product_id}_${timestamp}`;
        const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_"); // Replace unsafe chars

        // Create folder structure: products/[product_id]/[filename]
        const filePath = `products/${product_id}/${timestamp}_${safeFileName}`;

        // 1. Upload to storage bucket
        const storageResult = await uploadFile(file.buffer, filePath, file.mimetype);

        if (!storageResult || !storageResult.success) {
          throw new Error("Failed to upload file to storage");
        }

        // 2. Save record to database
        const dbResult = await query(
          `INSERT INTO shop_images (
            product_id,
            path,
            key,
            name,
            selected,
            position,
            mime_type,
            size,
            created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *`,
          [
            product_id,
            storageResult.key,
            storageResult.key,
            fileName,
            true, // Selected by default
            metadata.position || 0,
            file.mimetype,
            file.size || null,
            created_by || null,
          ]
        );

        // Add to results
        results.push({
          success: true,
          file: fileName,
          image: dbResult.rows[0],
          storage: storageResult,
        });
      } catch (error) {
        console.error("Error processing file upload:", error);
        results.push({
          success: false,
          file: file?.originalname || "Unknown file",
          error: error.message || "Unknown error during upload",
        });
      }
    }

    // Revalidate cache
    revalidateTag("product");

    return {
      success: results.some((r) => r.success), // At least one success
      results: results,
    };
  } catch (error) {
    console.error("Error in uploadProductImages:", error);
    return { error: error.message || "Unknown error during upload" };
  }
}

/**
 * Handle file uploads from form submission
 * This is designed to be used with Next.js Server Actions and FormData
 *
 * @param {FormData} formData - The form data object from the request
 * @returns {Promise<Object>} - Upload results
 */
export async function handleFormUpload(formData) {
  try {
    // Extract product ID
    const product_id = formData.get("product_id");
    if (!product_id) {
      return { error: "Product ID is required" };
    }

    // Extract user ID
    const created_by = formData.get("user_id") || null;

    // Extract files - supports multiple files with the same name
    const files = formData.getAll("files");
    const processedFiles = [];

    for (const file of files) {
      // Skip if not a File object
      if (!(file instanceof File)) continue;

      // Read the file data
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Add to processed files
      processedFiles.push({
        originalname: file.name,
        buffer: buffer,
        mimetype: file.type,
        size: file.size,
      });
    }

    if (processedFiles.length === 0) {
      return { error: "No valid files found in form data" };
    }

    // Use the uploadProductImages function to handle the upload
    return await uploadProductImages({
      product_id: Number(product_id),
      files: processedFiles,
      metadata: {
        position: 0, // Default position
      },
      created_by,
    });
  } catch (error) {
    console.error("Error handling form upload:", error);
    return { error: error.message || "Unknown error during form upload" };
  }
}

/**
 * Sync product images with storage
 * This function ensures database records match what's in storage and vice versa
 *
 * @param {number} productId - Product ID to sync images for
 * @returns {Promise<Object>} - Sync results
 */
export async function syncProductImagesWithStorage(productId) {
  try {
    if (!productId) {
      return { error: "Product ID is required" };
    }

    // Get database image records
    const dbResult = await query("SELECT * FROM shop_images WHERE product_id = $1", [productId]);
    const dbImages = dbResult.rows;

    // Get product info for folder path
    const productResult = await query("SELECT name, sex FROM shop_products WHERE id = $1", [productId]);

    if (productResult.rowCount === 0) {
      return { error: "Product not found" };
    }

    const product = productResult.rows[0];
    const folderPath = `products/${productId}/`;

    // List files in storage
    const { listFiles } = await import("@/lib/minio");
    const storageFiles = await listFiles(folderPath);

    // Track results
    const results = {
      synced: 0,
      added: 0,
      removed: 0,
      errors: [],
    };

    // Create a map of database records by key
    const dbImageMap = new Map();
    dbImages.forEach((img) => {
      dbImageMap.set(img.key, img);
    });

    // Create a map of storage files by key
    const storageFileMap = new Map();
    storageFiles.forEach((file) => {
      storageFileMap.set(file.Key, file);
    });

    // Begin transaction
    await query("BEGIN");

    try {
      // 1. Add missing database records for files found in storage
      for (const file of storageFiles) {
        if (!dbImageMap.has(file.Key)) {
          try {
            // File exists in storage but not in database - add it
            await query(
              `INSERT INTO shop_images (
                product_id, path, key, name, selected, position, mime_type, size
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8
              )`,
              [
                productId,
                file.Key,
                file.Key,
                file.Key.split("/").pop(),
                true, // Selected by default
                0, // Default position
                file.ContentType || "image/jpeg",
                file.Size || 0,
              ]
            );
            results.added++;
          } catch (error) {
            results.errors.push({
              operation: "add",
              key: file.Key,
              error: error.message,
            });
          }
        } else {
          results.synced++;
        }
      }

      // 2. Clean up database records for files not found in storage
      for (const dbImage of dbImages) {
        if (!storageFileMap.has(dbImage.key)) {
          try {
            // Database record exists but file not in storage - remove record
            await query("DELETE FROM shop_images WHERE id = $1", [dbImage.id]);
            results.removed++;
          } catch (error) {
            results.errors.push({
              operation: "remove",
              id: dbImage.id,
              key: dbImage.key,
              error: error.message,
            });
          }
        }
      }

      // Commit transaction
      await query("COMMIT");

      // Revalidate the cache
      revalidateTag("product");

      return {
        success: true,
        ...results,
      };
    } catch (error) {
      // Rollback on error
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error syncing product images with storage:", error);
    return { error: error.message || "Unknown error during sync operation" };
  }
}

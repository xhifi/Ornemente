/**
 * Helper functions for handling image database operations
 */

/**
 * Save uploaded images to the database
 * @param {number} productId - The ID of the product
 * @param {Array} images - Array of image objects with key, path properties
 * @param {string} userId - Optional user ID for tracking who created the records
 * @returns {Promise<Object>} Results of the save operation
 */
export async function saveImagesToDatabase(productId, images, userId = null) {
  if (!productId || !images || !Array.isArray(images) || images.length === 0) {
    throw new Error("Invalid parameters: productId and images array required");
  }

  try {
    const response = await fetch("/api/images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        images: images,
        created_by: userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to save images");
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving images to database:", error);
    throw error;
  }
}

/**
 * Get all images for a product from the database
 * @param {number} productId - The ID of the product
 * @returns {Promise<Array>} Array of product images
 */
export async function getProductImages(productId) {
  if (!productId) {
    throw new Error("Product ID is required");
  }

  try {
    const response = await fetch(`/api/images?product_id=${productId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch images");
    }

    const data = await response.json();
    return data.images || [];
  } catch (error) {
    console.error("Error fetching product images:", error);
    throw error;
  }
}

/**
 * Update the selected state of product images
 * @param {number} productId - The ID of the product
 * @param {Array} images - Array of image objects with key and selected properties
 * @returns {Promise<Object>} Results of the update operation
 */
export async function updateImageSelection(productId, images) {
  if (!productId || !images || !Array.isArray(images) || images.length === 0) {
    throw new Error("Invalid parameters: productId and images array required");
  }

  try {
    const response = await fetch("/api/images/selected", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        images: images,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update image selection");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating image selection:", error);
    throw error;
  }
}

/**
 * Delete an image from the database
 * @param {number} imageId - The ID of the image to delete
 * @returns {Promise<Object>} Result of the delete operation
 */
export async function deleteImage(imageId) {
  if (!imageId) {
    throw new Error("Image ID is required");
  }

  try {
    const response = await fetch(`/api/images?id=${imageId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete image");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
}

"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";

/**
 * Create a new product with minimal information
 *
 * @param {Object} productData - Product data with name, description, sex
 * @returns {Promise<Object>} - Created product or error
 */
export async function createProduct(productData) {
  try {
    // Validate required fields
    if (!productData.name) {
      return { error: "Product name is required" };
    }

    // Insert into database using parameterized query
    const result = await query(
      `INSERT INTO shop_products (
        name, 
        description, 
        sex,
        publish_status
      ) VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, sex, publish_status`,
      [productData.name, productData.description || null, productData.sex || null, productData.publish_status || "draft"]
    );

    if (result.rowCount === 0) {
      return { error: "Failed to create product" };
    }

    // Revalidate the cache for products
    revalidateTag("products");

    return {
      success: true,
      product: result.rows[0],
      productId: result.rows[0].id,
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return { error: error.message || "Unknown database error" };
  }
}

export default createProduct;

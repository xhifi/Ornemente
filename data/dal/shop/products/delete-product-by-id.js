"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { products as cache_key_products, product as cache_key_product } from "@/cache_keys";

/**
 * Delete a product by ID
 *
 * @param {number} productId - The product ID to delete
 * @returns {Promise<Object>} - Success message or error
 */
export async function deleteProductByID(productId) {
  try {
    // Validate required field
    if (!productId) {
      return { error: "Product ID is required" };
    }

    // Delete the product - we'll use a transaction to ensure data integrity
    await query("BEGIN");

    try {
      // First delete related records from child tables
      // Delete product sizes
      await query("DELETE FROM shop_product_sizes WHERE product_id = $1", [productId]);

      // Delete product designs
      await query("DELETE FROM shop_product_designs WHERE product_id = $1", [productId]);

      // Delete product pieces
      await query("DELETE FROM shop_pieces WHERE product_id = $1", [productId]);

      // Delete product images
      await query("DELETE FROM shop_images WHERE product_id = $1", [productId]);

      // Finally delete the product
      const result = await query("DELETE FROM shop_products WHERE id = $1 RETURNING id", [productId]);

      if (result.rowCount === 0) {
        await query("ROLLBACK");
        return { error: "Product not found" };
      }

      await query("COMMIT");

      // Revalidate the cache for products
      revalidateTag(cache_key_product(productId));
      revalidateTag(cache_key_products);

      return {
        success: true,
        message: "Product deleted successfully",
      };
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    return { error: error.message || "Unknown database error" };
  }
}

export default deleteProductByID;

"use server";

import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";
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

/**
 * Get a product by ID with all its related data
 */
export const getProductById = unstable_cache(
  async (productId) => {
    try {
      // Get product basic information
      const productResult = await query("SELECT * FROM shop_products WHERE id = $1", [productId]);

      if (productResult.rowCount === 0) {
        return { error: "Product not found" };
      }

      const product = productResult.rows[0];

      // Get product sizes
      const sizesResult = await query(
        `SELECT ps.*, s.code, s.label 
        FROM shop_product_sizes ps
        JOIN shop_sizes s ON ps.size_id = s.code
        WHERE ps.product_id = $1`,
        [productId]
      );

      // Get product designs
      const designsResult = await query(
        `SELECT d.* 
        FROM shop_product_designs pd
        JOIN shop_designs d ON pd.design_id = d.id
        WHERE pd.product_id = $1`,
        [productId]
      );

      // Get product pieces
      const piecesResult = await query("SELECT * FROM shop_pieces WHERE product_id = $1", [productId]);

      // Get product images
      const imagesResult = await query("SELECT * FROM shop_images WHERE product_id = $1 ORDER BY position", [productId]);

      return {
        success: true,
        product: {
          ...product,
          sizes: sizesResult.rows,
          designs: designsResult.rows,
          pieces: piecesResult.rows,
          images: imagesResult.rows,
        },
      };
    } catch (error) {
      console.error("Error fetching product:", error);
      return { error: error.message || "Unknown database error" };
    }
  },
  ["product"],
  {
    tags: ["product", "products"],
    revalidate: 30, // Cache for 30 seconds
  }
);

/**
 * Update an existing product
 *
 * @param {number} productId - The product ID to update
 * @param {Object} productData - Updated product data
 * @returns {Promise<Object>} - Updated product or error
 */
export async function updateProduct(productId, productData) {
  try {
    // Validate required fields
    if (!productId) {
      return { error: "Product ID is required" };
    }

    // Prepare dynamic update fields
    const updateFields = [];
    const values = [];
    let counter = 1;

    // Only include fields that were provided (skip name as it should be immutable)
    const updatableFields = [
      "description",
      "tagline",
      "sex",
      "type",
      "collection",
      "brand",
      "original_price",
      "discount",
      "note",
      "publish_status",
    ];

    updatableFields.forEach((field) => {
      if (productData[field] !== undefined) {
        updateFields.push(`${field} = $${counter}`);
        values.push(productData[field]);
        counter++;
      }
    });

    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);

    // If no fields to update, return early
    if (updateFields.length === 0) {
      return { error: "No fields to update" };
    }

    // Construct and execute query
    const queryText = `
      UPDATE shop_products 
      SET ${updateFields.join(", ")}
      WHERE id = $${counter}
      RETURNING *
    `;
    values.push(productId);

    const result = await query(queryText, values);

    if (result.rowCount === 0) {
      return { error: "Product not found" };
    }

    // Revalidate the cache for this product and products list
    revalidateTag("product");
    revalidateTag("products");

    return {
      success: true,
      product: result.rows[0],
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return { error: error.message || "Unknown database error" };
  }
}

/**
 * Delete a product by ID
 *
 * @param {number} productId - The product ID to delete
 * @returns {Promise<Object>} - Success message or error
 */
export async function deleteProduct(productId) {
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
      revalidateTag("product");
      revalidateTag("products");

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

/**
 * Get all products with pagination
 */
export async function getProducts({ page = 1, limit = 10, search = "", filters = {} } = {}) {
  try {
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;

    // Base query
    let queryText = `
      SELECT 
        p.*,
        s.name as sex_name,
        t.name as type_name,
        b.name as brand_name
      FROM shop_products p
      LEFT JOIN shop_sexes s ON p.sex = s.id
      LEFT JOIN shop_types t ON p.type = t.id
      LEFT JOIN shop_brands b ON p.brand = b.id
      WHERE 1=1
    `;

    // Search condition (using parameterized queries for security)
    if (search) {
      queryText += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add filters
    if (filters.sex) {
      queryText += ` AND p.sex = $${paramIndex}`;
      params.push(filters.sex);
      paramIndex++;
    }

    if (filters.type) {
      queryText += ` AND p.type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.brand) {
      queryText += ` AND p.brand = $${paramIndex}`;
      params.push(filters.brand);
      paramIndex++;
    }

    if (filters.publish_status) {
      queryText += ` AND p.publish_status = $${paramIndex}`;
      params.push(filters.publish_status);
      paramIndex++;
    }

    // Add order and pagination
    queryText += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // Execute query
    const result = await query(queryText, params);

    // Get total count for pagination - reuse the same WHERE conditions
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM shop_products p
      WHERE 1=1
    `;

    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (p.name ILIKE $${countParamIndex} OR p.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (filters.sex) {
      countQuery += ` AND p.sex = $${countParamIndex}`;
      countParams.push(filters.sex);
      countParamIndex++;
    }

    if (filters.type) {
      countQuery += ` AND p.type = $${countParamIndex}`;
      countParams.push(filters.type);
      countParamIndex++;
    }

    if (filters.brand) {
      countQuery += ` AND p.brand = $${countParamIndex}`;
      countParams.push(filters.brand);
      countParamIndex++;
    }

    if (filters.publish_status) {
      countQuery += ` AND p.publish_status = $${countParamIndex}`;
      countParams.push(filters.publish_status);
      countParamIndex++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      products: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error getting products:", error);
    return { error: error.message || "Unknown database error" };
  }
}

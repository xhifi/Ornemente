"use server";

import { query } from "@/lib/db";
import { generate500x500URL, generateThumbnailURL } from "@/lib/utils";
import { revalidateTag, unstable_cache } from "next/cache";

/**
 * Get all products with pagination
 */
const getProductsPaginated = unstable_cache(
  async ({ page = 1, limit = 10, search = "", filters = {} } = {}) => {
    try {
      const offset = (page - 1) * limit;
      const params = [];
      let paramIndex = 1;

      // Base query - get products with their related data
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

      // Handle multiple type filter values
      if (filters.type) {
        if (Array.isArray(filters.type) && filters.type.length > 0) {
          queryText += ` AND p.type = ANY($${paramIndex})`;
          params.push(filters.type);
        } else {
          queryText += ` AND p.type = $${paramIndex}`;
          params.push(filters.type);
        }
        paramIndex++;
      }

      // Handle multiple brand filter values
      if (filters.brand) {
        if (Array.isArray(filters.brand) && filters.brand.length > 0) {
          queryText += ` AND p.brand = ANY($${paramIndex})`;
          params.push(filters.brand);
        } else {
          queryText += ` AND p.brand = $${paramIndex}`;
          params.push(filters.brand);
        }
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

      // Get product IDs for image query
      const productIds = result.rows.map((product) => product.id);

      // Get images for all products in a single query (if there are products)
      let productsWithImages = [...result.rows];

      if (productIds.length > 0) {
        const imagesQuery = `
        SELECT 
          id, 
          product_id, 
          path, 
          key, 
          name, 
          selected, 
          position,
          mime_type,
          size,
          width,
          height
        FROM shop_images
        WHERE product_id = ANY($1)
        ORDER BY product_id, position
      `;

        const imagesResult = await query(imagesQuery, [productIds]);

        // Group images by product_id
        const imagesByProduct = {};
        imagesResult.rows.forEach((image) => {
          if (!imagesByProduct[image.product_id]) {
            imagesByProduct[image.product_id] = [];
          }
          const resized_thumb = generateThumbnailURL(image.key);
          const resized_500x500 = generate500x500URL(image.key);

          imagesByProduct[image.product_id].push({ ...image, resized_thumb, resized_500x500 });
        });

        // Add images to products
        productsWithImages = productsWithImages.map((product) => ({
          ...product,
          images: imagesByProduct[product.id] || [],
          featured_image: (imagesByProduct[product.id] || []).find((img) => img.selected) || (imagesByProduct[product.id] || [])[0] || null,
        }));
      }

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

      // Handle multiple type filter values for count query
      if (filters.type) {
        if (Array.isArray(filters.type) && filters.type.length > 0) {
          countQuery += ` AND p.type = ANY($${countParamIndex})`;
          countParams.push(filters.type);
        } else {
          countQuery += ` AND p.type = $${countParamIndex}`;
          countParams.push(filters.type);
        }
        countParamIndex++;
      }

      // Handle multiple brand filter values for count query
      if (filters.brand) {
        if (Array.isArray(filters.brand) && filters.brand.length > 0) {
          countQuery += ` AND p.brand = ANY($${countParamIndex})`;
          countParams.push(filters.brand);
        } else {
          countQuery += ` AND p.brand = $${countParamIndex}`;
          countParams.push(filters.brand);
        }
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
        products: productsWithImages,
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
  },
  {
    tags: ["products", "product"],
    revalidate: 30, // Revalidate every 30 seconds
  }
);

export default getProductsPaginated;

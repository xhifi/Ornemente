"use server";

import { query } from "@/lib/db";
import { generate500x500URL, generateThumbnailURL } from "@/lib/utils";
import { revalidateTag, unstable_cache } from "next/cache";
import { products as cache_key_products } from "@/cache_keys";
/**
 * Get all products with pagination
 * @param {Object} options - Options for pagination, filtering and searching
 * @param {number} [options.page=1] - The page number to fetch
 * @param {number} [options.limit=20] - Number of products per page
 * @param {string} [options.search=""] - Search term for product name and description
 * @param {Object} [options.filters={}] - Filter options
 * @param {number|number[]} [options.filters.sex] - Filter by sex/gender ID
 * @param {number|number[]} [options.filters.type] - Filter by product type ID or array of IDs
 * @param {number|number[]} [options.filters.brand] - Filter by brand ID or array of IDs
 * @param {string|string[]} [options.filters.publish_status] - Filter by publication status ("draft" or "published")
 * @param {string|string[]} [options.filters.published_status] - Alternative to publish_status
 * @returns {Promise<Object>} - Products with pagination details
 */
const getProductsPaginated = unstable_cache(
  async ({ page = 1, limit = 20, search = "", filters = {} } = {}) => {
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

      // Handle product publish status filter - accepts both publish_status and published_status for flexibility
      // Valid values are 'draft' or 'published' as per the database schema constraint
      if (filters.publish_status || filters.published_status) {
        const status = filters.publish_status || filters.published_status;
        if (status === "published" || status === "draft") {
          queryText += ` AND p.publish_status = $${paramIndex}`;
          params.push(status);
          paramIndex++;
        }
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
          *
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

        // Add images and calculate totalDiscountAmount for products
        productsWithImages = productsWithImages.map((product) => {
          // Handle null/undefined values with defaults
          const hasOriginalPrice = product.original_price !== null && product.original_price !== undefined;
          const hasDiscount = product.discount !== null && product.discount !== undefined;

          // Calculate prices only if we have valid data
          let totalDiscountAmount = 0;
          let finalPrice = 0;

          if (hasOriginalPrice) {
            const originalPrice = parseFloat(product.original_price) || 0;
            const discountPercentage = hasDiscount ? parseFloat(product.discount) || 0 : 0;

            // Calculate discount and final price
            totalDiscountAmount = originalPrice * (discountPercentage / 100);
            finalPrice = originalPrice - totalDiscountAmount;

            // Round to 2 decimal places
            totalDiscountAmount = parseFloat(totalDiscountAmount.toFixed(2));
            finalPrice = parseFloat(finalPrice.toFixed(2));
          }

          return {
            ...product,
            images: imagesByProduct[product.id] || [],
            featured_image:
              (imagesByProduct[product.id] || []).find((img) => img.selected) || (imagesByProduct[product.id] || [])[0] || null,
            totalDiscountAmount,
            finalPrice,
          };
        });
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

      // Handle product publish status filter for count query
      if (filters.publish_status || filters.published_status) {
        const status = filters.publish_status || filters.published_status;
        if (status === "published" || status === "draft") {
          countQuery += ` AND p.publish_status = $${countParamIndex}`;
          countParams.push(status);
          countParamIndex++;
        }
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
  [cache_key_products],
  {
    tags: [cache_key_products],
    revalidate: 3600, // Revalidate every 5 minutes
  }
);

export default getProductsPaginated;

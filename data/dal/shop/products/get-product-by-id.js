"use server";

import { query } from "@/lib/db";
import { generate500x500URL, generateThumbnailURL } from "@/lib/utils";
import { unstable_cache } from "next/cache";

/**
 * Get a product by ID with all its related data
 */
export const getProductById = unstable_cache(
  async (productId) => {
    try {
      // Get product basic information with related sex, type, and brand details
      const productResult = await query(
        `
        SELECT 
          p.*,
          s.name as sex_name,
          t.name as type_name,
          b.name as brand_name,
          c.name as collection_name
        FROM shop_products p
        LEFT JOIN shop_sexes s ON p.sex = s.id
        LEFT JOIN shop_types t ON p.type = t.id
        LEFT JOIN shop_brands b ON p.brand = b.id
        LEFT JOIN shop_collections c ON p.collection = c.id
        WHERE p.id = $1
      `,
        [productId]
      );

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

      // Get product pieces with color and fabric details
      const piecesResult = await query(
        `
        SELECT 
          p.*,
          f.id as fabric_id,
          f.name as fabric_name,
          f.slug as fabric_slug,
          c.id as color_id,
          c.name as color_name,
          c.slug as color_slug,
          c.hex as color_hex
        FROM shop_pieces p
        LEFT JOIN shop_fabrics f ON p.fabric = f.id
        LEFT JOIN shop_colors c ON p.color = c.id
        WHERE p.product_id = $1
      `,
        [productId]
      );

      // Get product images
      const imagesResult = await query("SELECT * FROM shop_images WHERE product_id = $1 ORDER BY position", [productId]);
      const imagesWithSizes = imagesResult.rows.map((image) => {
        const resized_thumb = generateThumbnailURL(image.key);
        const resized_500x500 = generate500x500URL(image.key);
        return {
          ...image,
          resized_thumb,
          resized_500x500,
        };
      });

      const discount =
        productResult.rows[0]?.discount > 0 && (productResult.rows[0]?.discount / 100) * productResult.rows[0]?.original_price;
      const discountedPrice = parseInt(discount && productResult.rows[0]?.original_price - discount);

      return {
        success: true,
        product: {
          ...product,
          discounted_price: discountedPrice,
          sizes: sizesResult.rows,
          designs: designsResult.rows,
          pieces: piecesResult.rows,
          images: imagesWithSizes,
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

export default getProductById;

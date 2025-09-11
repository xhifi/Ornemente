"use server";

import { query } from "@/lib/db";
import { generate500x500URL, generateThumbnailURL } from "@/lib/utils";
import { unstable_cache } from "next/cache";
import { product as cache_key_product, products as cache_key_products } from "@/cache_keys";

/**
 * Get a product by ID with all its related data
 */
function getProductById(productId) {
  return unstable_cache(
    async () => {
      // all your logic here using productId
      const productResult = await query(
        `
        SELECT 
          p.*,
          s.name as variant_name,
          t.name as type_name,
          b.name as brand_name,
          c.name as collection_name
        FROM shop_products p
        LEFT JOIN shop_variants s ON p.variant = s.id
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

      const sizesResult = await query(
        `SELECT ps.*, s.code, s.label 
        FROM shop_product_sizes ps
        JOIN shop_sizes s ON ps.size_id = s.code
        WHERE ps.product_id = $1`,
        [productId]
      );

      const designsResult = await query(
        `SELECT d.* 
        FROM shop_product_designs pd
        JOIN shop_designs d ON pd.design_id = d.id
        WHERE pd.product_id = $1`,
        [productId]
      );

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

      const discount = product.discount > 0 && (product.discount / 100) * product.original_price;
      const discountedPrice = parseInt(discount && product.original_price - discount);

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
    },
    [cache_key_product(productId), cache_key_products], // cache key
    {
      tags: [cache_key_product(productId), cache_key_products],
      revalidate: 3600,
    }
  )();
}

export default getProductById;

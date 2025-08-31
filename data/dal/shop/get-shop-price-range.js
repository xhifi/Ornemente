"use server";
import { priceRange as cache_key_price_range } from "@/cache_keys";
import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";

const getShopPriceRange = unstable_cache(
  async () => {
    try {
      const res = await query(`
        SELECT 
          MIN(p.original_price - (p.original_price * COALESCE(p.discount, 0) / 100)) as min_price,
          MAX(p.original_price - (p.original_price * COALESCE(p.discount, 0) / 100)) as max_price
        FROM 
          shop_products p
        WHERE 
          p.original_price IS NOT NULL 
          AND p.original_price > 0
          AND p.publish_status = 'published'
      `);

      if (res.rowCount === 0 || !res.rows[0].min_price || !res.rows[0].max_price) {
        // Return default range if no products found
        return {
          ok: true,
          data: {
            min_price: 0,
            max_price: 10000,
          },
          error: null,
        };
      }

      const minPrice = Math.floor(parseFloat(res.rows[0].min_price));
      const maxPrice = Math.ceil(parseFloat(res.rows[0].max_price));

      return {
        ok: true,
        data: {
          min_price: minPrice,
          max_price: maxPrice,
        },
        error: null,
      };
    } catch (error) {
      return {
        ok: false,
        data: {
          min_price: 0,
          max_price: 10000,
        },
        error: error.message,
      };
    }
  },
  [cache_key_price_range],
  {
    tags: [cache_key_price_range],
    revalidate: 3600, // Cache for 1 hour since prices don't change very frequently
  }
);

export default getShopPriceRange;

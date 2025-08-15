"use server";
import { sizes as cache_key_sizes } from "@/cache_keys";
import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";

const getShopSizes = unstable_cache(
  async () => {
    try {
      const res = await query(`
        SELECT 
          s.code,
          s.label,
          s.slug,
          s.created_at,
          s.updated_at,
          COUNT(ps.product_id) as product_count
        FROM 
          shop_sizes s
        LEFT JOIN 
          shop_product_sizes ps ON s.code = ps.size_id
        GROUP BY 
          s.code, s.label, s.slug, s.created_at, s.updated_at
        ORDER BY 
          s.code ASC;
      `);

      if (res.rowCount === 0) {
        return { ok: true, data: [], error: null };
      }
      return {
        ok: true,
        data: res.rows,
        error: null,
      };
    } catch (error) {
      return { ok: false, data: null, error: error.message };
    }
  },
  [cache_key_sizes],
  {
    tags: [cache_key_sizes],
    revalidate: 3600, // Cache for 3600 seconds
  }
);

export default getShopSizes;

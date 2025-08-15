"use server";
import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { types as cache_key_types } from "@/cache_keys";

const getShopTypes = unstable_cache(
  async () => {
    try {
      const res = await query(`
        SELECT 
          t.*, 
          COALESCE(COUNT(p.id), 0)::int AS product_count
        FROM 
          shop_types t
        LEFT JOIN 
          shop_products p ON t.id = p.type
        GROUP BY 
          t.id
        ORDER BY 
          t.name ASC;
      `);
      if (res.rowCount === 0) {
        return {
          ok: true,
          data: [],
          error: null,
        };
      }
      return {
        ok: true,
        data: res.rows,
        error: null,
      };
    } catch (error) {
      return {
        ok: false,
        data: null,
        error: error.message,
      };
    }
  },
  [cache_key_types],
  {
    tags: [cache_key_types],
    revalidate: 60, // Cache for 60 seconds
  }
);

export default getShopTypes;

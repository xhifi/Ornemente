"use server";
import { colors as cache_key_colors } from "@/cache_keys";
import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";

const getShopColors = unstable_cache(
  async (name) => {
    try {
      if (name) {
        const res = await query(`SELECT * FROM shop_colors WHERE slug = $1;`, [name]);
        if (!res.rowCount) {
          return {
            ok: false,
            data: null,
            error: `${name} not found in shop colors`,
          };
        }
        return {
          ok: true,
          data: res.rows,
          error: null,
        };
      }
      const res = await query(`
        SELECT 
          c.*, 
          COALESCE(COUNT(DISTINCT sp.product_id), 0)::int AS product_count
        FROM 
          shop_colors c
        LEFT JOIN 
          shop_pieces sp ON c.id = sp.color
        GROUP BY 
          c.id
        ORDER BY 
          c.created_at DESC;
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
  [cache_key_colors],
  {
    tags: [cache_key_colors],
    revalidate: 60, // Cache for 60 seconds
  }
);

export default getShopColors;

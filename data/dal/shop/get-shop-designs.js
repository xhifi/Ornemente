"use server";
import { designs as cache_key_designs } from "@/cache_keys";
import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";

const getShopDesigns = unstable_cache(
  async () => {
    try {
      const res = await query(`
        SELECT 
          d.id,
          d.name,
          d.slug,
          d.created_at,
          d.updated_at,
          COUNT(pd.product_id) as product_count
        FROM 
          shop_designs d
        LEFT JOIN 
          shop_product_designs pd ON d.id = pd.design_id
        GROUP BY 
          d.id, d.name, d.slug, d.created_at, d.updated_at
        ORDER BY 
          d.name ASC;
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
  [cache_key_designs],
  {
    tags: [cache_key_designs],
    revalidate: 3600, // Cache for 3600 seconds
  }
);

export default getShopDesigns;

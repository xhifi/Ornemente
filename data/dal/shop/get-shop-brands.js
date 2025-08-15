"use server";
import { brands as cache_key_brands } from "@/cache_keys";
import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";

const getShopBrands = unstable_cache(
  async () => {
    try {
      const res = await query(`
        SELECT 
          b.id,
          b.name,
          b.slug,
          b.created_at,
          b.updated_at,
          COUNT(p.id) as product_count,
          img.path as image_url,
          img.key,
          img.size_variations
        FROM 
          shop_brands b
        LEFT JOIN 
          shop_products p ON b.id = p.brand
        LEFT JOIN LATERAL (
          SELECT i.path, i.key, i.size_variations
          FROM shop_images i
          WHERE i.brand_id = b.id
          ORDER BY i.created_at DESC, i.position DESC
          LIMIT 1
        ) img ON true
        GROUP BY 
          b.id, b.name, b.slug, b.created_at, b.updated_at, img.path, img.key, img.size_variations
        ORDER BY 
          b.name ASC;
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
  [cache_key_brands],
  {
    tags: [cache_key_brands],
    revalidate: 3600, // Cache for 3600 seconds
  }
);

export default getShopBrands;

"use server";

import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { brands as cache_key_brands } from "@/cache_keys";

const getBrandImage = unstable_cache(
  async (brandId) => {
    try {
      if (!brandId) {
        throw new Error("Brand ID is required");
      }

      const res = await query(
        `
        SELECT * FROM shop_images 
        WHERE brand_id = $1
        ORDER BY position ASC
        LIMIT 1
      `,
        [brandId]
      );

      if (res.rowCount === 0) {
        return { ok: true, data: null, error: null };
      }

      return { ok: true, data: res.rows[0], error: null };
    } catch (error) {
      console.error(`[getBrandImage] Error fetching brand image:`, error);
      return { ok: false, data: null, error: error.message };
    }
  },
  (brandId) => [`${cache_key_brands}-image-${brandId}`],
  {
    tags: [cache_key_brands],
    revalidate: 3600, // Cache for 3600 seconds
  }
);

export default getBrandImage;

"use server";
import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";

const getShopVariants = unstable_cache(
  async (slug) => {
    try {
      if (slug) {
        const res = await query(`SELECT * FROM shop_variants WHERE slug = $1;`, [slug]);
        if (!res.rowCount) {
          return {
            ok: false,
            data: null,
            error: `${slug} not found in available variants in the shop`,
          };
        }
        return {
          ok: true,
          data: res.rows,
          error: null,
        };
      }

      const res = await query(`SELECT * FROM shop_variants;`);
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
  ["shop-variants"],
  {
    tags: ["shop-variants"],
    revalidate: 60, // Cache for 60 seconds
  }
);

export default getShopVariants;

"use server";
import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";

const getShopDesigns = unstable_cache(
  async (slug) => {
    try {
      if (slug) {
        const res = await query(`SELECT * FROM shop_designs WHERE slug = $1;`, [slug]);
        if (!res.rowCount) {
          return {
            ok: false,
            data: null,
            error: `${slug} not found in shop designs`,
          };
        }
        return {
          ok: true,
          data: res.rows,
          error: null,
        };
      }
      const res = await query(`SELECT * FROM shop_designs;`);
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
  ["shop-designs"],
  {
    tags: ["shop-designs"],
    revalidate: 60, // Cache for 60 seconds
  }
);

export default getShopDesigns;

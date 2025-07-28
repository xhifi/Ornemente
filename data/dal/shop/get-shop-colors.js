"use server";
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
            error: `${slug} not found in shop colors`,
          };
        }
        return {
          ok: true,
          data: res.rows,
          error: null,
        };
      }
      const res = await query(`SELECT * FROM shop_colors;`);
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
  ["shop-colors"],
  {
    tags: ["shop-colors"],
    revalidate: 60, // Cache for 60 seconds
  }
);

export default getShopColors;

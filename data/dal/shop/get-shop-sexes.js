"use server";
import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";

const getShopSexes = unstable_cache(
  async (slug) => {
    try {
      if (slug) {
        const res = await query(`SELECT * FROM shop_sexes WHERE slug = $1;`, [slug]);
        if (!res.rowCount) {
          return {
            ok: false,
            data: null,
            error: `${slug} not found in available sexes in the shop`,
          };
        }
        return {
          ok: true,
          data: res.rows,
          error: null,
        };
      }

      const res = await query(`SELECT * FROM shop_sexes;`);
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
  ["shop-sexes"],
  {
    tags: ["shop-sexes"],
    revalidate: 60, // Cache for 60 seconds
  }
);

export default getShopSexes;

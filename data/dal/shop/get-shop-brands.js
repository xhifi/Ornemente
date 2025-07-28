"use server";
import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";

const getShopBrands = unstable_cache(
  async () => {
    try {
      const res = await query(`SELECT * FROM shop_brands;`);
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
  ["shop-brands"],
  {
    tags: ["shop-brands"],
    revalidate: 60, // Cache for 60 seconds
  }
);

export default getShopBrands;

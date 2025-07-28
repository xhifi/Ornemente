"use server";
import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";

const getShopFabrics = unstable_cache(
  async (name) => {
    try {
      if (name) {
        const res = await query(`SELECT * FROM shop_fabrics WHERE name = $1;`, [name]);
        if (!res.rowCount) {
          return {
            ok: false,
            data: null,
            error: `${name} not found in fabrics`,
          };
        }
        return {
          ok: true,
          data: res.rows,
          error: null,
        };
      }
      const res = await query(`SELECT * FROM shop_fabrics;`);
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
  ["shop-fabrics"],
  {
    tags: ["shop-fabrics"],
    revalidate: 60, // Cache for 60 seconds
  }
);

export default getShopFabrics;
